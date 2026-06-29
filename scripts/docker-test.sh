#!/usr/bin/env bash
# Build, run, and test nginx-love entirely via Docker (no host Node/pnpm required).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

IMAGE_TAG="${IMAGE_TAG:-local}"
WEB_PORT="${WEB_PORT:-8080}"
RUN_UNIT_TESTS="${RUN_UNIT_TESTS:-1}"

log() { echo "[docker-test] $*"; }
fail() { echo "[docker-test] FAIL: $*" >&2; exit 1; }

if ! command -v docker &>/dev/null; then
  fail "Docker is required"
fi

if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  fail "Docker Compose is required"
fi

ensure_env() {
  if [ -f .env ]; then
    log "Using existing .env"
    return
  fi
  log "Creating .env from .env.docker.example..."
  cp .env.docker.example .env
  if command -v openssl &>/dev/null; then
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
  fi
}

# shellcheck disable=SC1091
load_env() {
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
}

build_images() {
  log "Building Docker images (base may take a while on first run)..."
  bash scripts/docker-build.sh all
}

start_stack() {
  log "Starting Docker Compose stack..."
  IMAGE_TAG="$IMAGE_TAG" BASE_IMAGE="nginx-love-base:${IMAGE_TAG}" \
    $COMPOSE --env-file .env up -d --build
}

run_unit_tests_in_docker() {
  log "Running API unit tests inside Docker (no host Node/pnpm)..."
  load_env

  local network
  network="$($COMPOSE --env-file .env ps -q postgres 2>/dev/null | head -1)"
  if [ -z "$network" ]; then
    fail "Postgres container not running — start stack first"
  fi
  network="$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' "$network" | head -1)"

  docker run --rm \
    --network "$network" \
    -v "$ROOT:/app" \
    -w /app \
    -e CI=true \
    -e DATABASE_URL="postgresql://${DB_USER:-nginx_love_user}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-nginx_love_db}?schema=public" \
    -e NODE_ENV=test \
    -e JWT_ACCESS_SECRET=test-access-secret-key-12345 \
    -e JWT_REFRESH_SECRET=test-refresh-secret-key-12345 \
    -e SESSION_SECRET=test-session-secret-12345 \
    -e BCRYPT_ROUNDS=4 \
    node:20-alpine sh -ec '
      apk add --no-cache openssl
      corepack enable && corepack prepare pnpm@8.15.0 --activate
      pnpm install --frozen-lockfile
      pnpm --filter @nginx-love/shared build
      cd apps/api
      cp -n .env.example .env 2>/dev/null || true
      pnpm prisma generate
      pnpm prisma migrate deploy
      pnpm test
    '
}

run_smoke() {
  log "Running product smoke tests..."
  WEB_PORT="$WEB_PORT" bash scripts/docker-smoke-test.sh
}

main() {
  ensure_env
  build_images
  start_stack

  run_smoke

  if [ "$RUN_UNIT_TESTS" = "1" ]; then
    run_unit_tests_in_docker
  fi

  log "All Docker build/test checks passed"
  log "Admin UI: http://127.0.0.1:${WEB_PORT}/  (admin / admin123 on fresh DB, or Admin123! after first login)"
}

main "$@"
