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

log "Upgrade complete. Migrations run automatically on backend start."
log "Verify: curl -s http://localhost:8080/api/health"
