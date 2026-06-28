#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[install-docker]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }

if ! command -v docker &>/dev/null; then
  echo "Docker is required. Install Docker Engine first: https://docs.docker.com/engine/install/"
  exit 1
fi

if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  echo "Docker Compose is required."
  exit 1
fi

if [ ! -f .env ]; then
  log "Creating .env from .env.docker.example..."
  cp .env.docker.example .env

  gen_secret() { openssl rand -base64 48 | tr -d "=+/" | cut -c1-48; }

  DB_PASS="$(gen_secret)"
  JWT_ACCESS="$(gen_secret)"
  JWT_REFRESH="$(gen_secret)"
  SESSION="$(gen_secret)"

  sed -i "s|change_this_to_a_secure_password|${DB_PASS}|g" .env
  sed -i "0,/change-this-to-random-secret/s|change-this-to-random-secret|${JWT_ACCESS}|" .env
  sed -i "0,/change-this-to-random-secret/s|change-this-to-random-secret|${JWT_REFRESH}|" .env
  sed -i "0,/change-this-to-random-secret/s|change-this-to-random-secret|${SESSION}|" .env
  sed -i "s|postgresql://nginx_love_user:.*@postgres|postgresql://nginx_love_user:${DB_PASS}@postgres|" .env

  log "Generated secrets in .env — back up this file."
else
  log "Using existing .env"
fi

log "Building images (base may take ~15 minutes on first run)..."
bash scripts/docker-build.sh all

log "Starting stack..."
IMAGE_TAG="${IMAGE_TAG:-local}" ${COMPOSE} --env-file .env up -d --build

log "Waiting for health checks..."
sleep 10

if curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then
  log "API (via proxy): http://localhost:8080/api/health"
else
  warn "API not ready yet — check: ${COMPOSE} logs backend frontend"
fi

log "Install complete. Default login: admin / admin123 (change after first login)."
log "  operator / operator123  |  viewer / viewer123"
log "Admin portal: http://YOUR_HOST:8080 — API proxied at /api (port 3001 not public)."
