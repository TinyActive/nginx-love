#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
NC='\033[0m'
log() { echo -e "${GREEN}[upgrade-docker]${NC} $*"; }

PULL_ONLY=false
SKIP_GIT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pull) PULL_ONLY=true; shift ;;
    --skip-git) SKIP_GIT=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ ! -f .env ]; then
  echo "Missing .env — run scripts/install-docker.sh first."
  exit 1
fi

if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
else
  COMPOSE="docker-compose"
fi

if [ "$SKIP_GIT" = false ] && [ -d .git ]; then
  log "Pulling latest source..."
  git pull --ff-only || log "git pull skipped or failed — continuing with local tree"
fi

if [ "$PULL_ONLY" = true ] && [ -n "${DOCKERHUB_USER:-}" ]; then
  log "Pulling images from Docker Hub..."
  ${COMPOSE} -f docker-compose.yml -f docker-compose.pull.yml --env-file .env pull
  ${COMPOSE} -f docker-compose.yml -f docker-compose.pull.yml --env-file .env up -d
else
  log "Rebuilding and restarting (database volumes preserved)..."
  bash scripts/docker-build.sh all
  ${COMPOSE} --env-file .env up -d --build
fi

log "Upgrade complete. Migrations and domain vhost sync run automatically on backend start."
log "  (nginx.conf + JA4 vhosts regenerated from database each backend container start)"

WEB_PORT="${WEB_PORT:-8080}"
MAX_WAIT=120
elapsed=0
while [[ "$elapsed" -lt "$MAX_WAIT" ]]; do
  if docker inspect -f '{{.State.Health.Status}}' nginx-love-backend 2>/dev/null | grep -q healthy; then
    break
  fi
  sleep 3
  elapsed=$((elapsed + 3))
done

if docker inspect -f '{{.State.Health.Status}}' nginx-love-backend 2>/dev/null | grep -q healthy; then
  log "Backend healthy"
  if docker exec nginx-love-backend grep -rq 'ja4 on' /etc/nginx/sites-enabled/ 2>/dev/null; then
    log "JA4 vhosts present in sites-enabled"
  else
    log "No SSL domains yet, or JA4 vhosts will appear after you add domains with HTTPS"
  fi
else
  log "Backend still starting — check: docker compose logs -f backend"
fi

log "Verify: curl -s http://localhost:${WEB_PORT}/api/health"
