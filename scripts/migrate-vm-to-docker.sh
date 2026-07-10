#!/usr/bin/env bash
set -euo pipefail

# Migrate legacy VM install (deploy.sh) to Docker Compose stack.
# Run as root on a server that currently uses systemd + host nginx.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BACKUP_DIR="/var/backups/nginx-love-migrate-$(date +%Y%m%d-%H%M%S)"
DB_CONTAINER="nginx-love-postgres"
LEGACY_ENV="${ROOT}/apps/api/.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[migrate]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*"; exit 1; }

if [ "$(id -u)" -ne 0 ]; then
  error "Run as root"
fi

mkdir -p "$BACKUP_DIR"

log "Step 1/7: Backup PostgreSQL..."
if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  docker exec "${DB_CONTAINER}" pg_dump -U nginx_love_user nginx_love_db > "${BACKUP_DIR}/postgres.sql"
  log "Dump saved to ${BACKUP_DIR}/postgres.sql"
else
  warn "Legacy DB container not found — skipping pg_dump"
fi

log "Step 2/7: Backup nginx config and SSL..."
tar -czf "${BACKUP_DIR}/nginx-etc.tar.gz" /etc/nginx 2>/dev/null || warn "Could not backup /etc/nginx"
[ -f "${LEGACY_ENV}" ] && cp "${LEGACY_ENV}" "${BACKUP_DIR}/api.env"
[ -f /root/.nginx-love-credentials ] && cp /root/.nginx-love-credentials "${BACKUP_DIR}/"

log "Step 3/7: Stop legacy systemd services..."
for svc in nginx-love-backend nginx-love-frontend nginx; do
  systemctl stop "${svc}" 2>/dev/null || true
  systemctl disable "${svc}" 2>/dev/null || true
done

log "Step 4/7: Prepare Docker .env..."
if [ ! -f .env ]; then
  cp .env.docker.example .env
  warn "Created new .env — copy secrets from ${BACKUP_DIR}/api.env if needed"
fi

log "Step 5/7: Start Compose postgres only..."
docker compose -f docker-compose.db.yml --env-file .env up -d

log "Waiting for postgres..."
sleep 8

if [ -f "${BACKUP_DIR}/postgres.sql" ]; then
  log "Step 6/7: Import database dump..."
  docker compose -f docker-compose.db.yml --env-file .env exec -T postgres \
    psql -U nginx_love_user -d nginx_love_db < "${BACKUP_DIR}/postgres.sql" || warn "Import had warnings — review logs"
fi

log "Step 7/7: Start full stack..."
bash scripts/install-docker.sh 2>/dev/null || docker compose --env-file .env up -d --build

log ""
log "Migration checklist:"
log "  [ ] curl http://localhost:8080/health"
log "  [ ] curl http://localhost:8080/api/health"
log "  [ ] Login to UI and verify domains/SSL"
log "  [ ] Restore nginx site configs from ${BACKUP_DIR}/nginx-etc.tar.gz if needed"
log "  Backups: ${BACKUP_DIR}"
