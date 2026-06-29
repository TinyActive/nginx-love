#!/usr/bin/env bash
# Smoke test for Docker Compose product stack (API + UI).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WEB_PORT="${WEB_PORT:-8080}"
BASE="http://127.0.0.1:${WEB_PORT}"
MAX_WAIT="${SMOKE_WAIT_SEC:-180}"

log() { echo "[smoke] $*"; }
fail() { echo "[smoke] FAIL: $*" >&2; exit 1; }

wait_healthy() {
  local elapsed=0
  while [[ "$elapsed" -lt "$MAX_WAIT" ]]; do
    if docker compose ps --format json 2>/dev/null | grep -q '"Health":"healthy"'; then
      local unhealthy
      unhealthy="$(docker compose ps | grep -v healthy | grep -E 'backend|frontend|postgres' || true)"
      if [[ -z "$unhealthy" ]]; then
        log "All services healthy"
        return 0
      fi
    fi
    sleep 5
    elapsed=$((elapsed + 5))
  done
  fail "Timed out waiting for healthy containers (${MAX_WAIT}s)"
}

curl_ok() {
  local url="$1"
  curl -sf "$url" >/dev/null || fail "HTTP check failed: $url"
}

log "Checking container health..."
wait_healthy

log "Frontend health"
curl_ok "${BASE}/health"

log "API health (via proxy)"
curl_ok "${BASE}/api/health"

log "UI routes"
curl_ok "${BASE}/"
curl_ok "${BASE}/login"

json_field() {
  echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | head -1 | cut -d'"' -f4 || true
}

log "Auth login"
login_as() {
  curl -s -X POST "${BASE}/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"admin\",\"password\":\"$1\"}"
}

LOGIN_RESP="$(login_as admin123)"
if ! echo "$LOGIN_RESP" | grep -qE '"accessToken"|"requirePasswordChange"|"tempToken"'; then
  LOGIN_RESP="$(login_as 'Admin123!')"
fi
if ! echo "$LOGIN_RESP" | grep -qE '"accessToken"|"requirePasswordChange"|"tempToken"'; then
  fail "Login request failed"
fi

TOKEN="$(json_field "$LOGIN_RESP" accessToken)"
if [[ -z "$TOKEN" ]]; then
  TEMP_TOKEN="$(json_field "$LOGIN_RESP" tempToken)"
  USER_ID="$(json_field "$LOGIN_RESP" userId)"
  if [[ -n "$TEMP_TOKEN" && -n "$USER_ID" ]]; then
    log "First login — completing password change"
    CHANGE_RESP="$(curl -sf -X POST "${BASE}/api/auth/first-login/change-password" \
      -H 'Content-Type: application/json' \
      -d "{\"userId\":\"${USER_ID}\",\"tempToken\":\"${TEMP_TOKEN}\",\"newPassword\":\"Admin123!\"}")" \
      || fail "First-login password change failed"
    TOKEN="$(json_field "$CHANGE_RESP" accessToken)"
  fi
fi

if [[ -z "$TOKEN" ]]; then
  fail "No accessToken after login (check seed-safe / auth flow)"
fi

auth_curl() {
  curl -sf -H "Authorization: Bearer ${TOKEN}" "$1" >/dev/null
}

log "Bot Manager API"
auth_curl "${BASE}/api/bot-manager/profiles"
auth_curl "${BASE}/api/bot-manager/global-rules"

log "Domains API"
auth_curl "${BASE}/api/domains"

log "All smoke checks passed"
