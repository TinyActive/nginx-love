#!/usr/bin/env bash
# WAF Bot Manager block verification — expects Python/Node blocked, curl allowed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${ROOT}/config.env" 2>/dev/null || true

WAF_URL="${WAF_URL:-https://waf.autogate.cc}"
CURL_EXTRA_ARGS="${CURL_EXTRA_ARGS:-}"
PASS=0
FAIL=0

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
pass() { PASS=$((PASS + 1)); log "PASS: $*"; }
fail() { FAIL=$((FAIL + 1)); log "FAIL: $*"; }

http_code() {
  local extra=("$@")
  curl -sk -o /dev/null -w '%{http_code}' ${CURL_EXTRA_ARGS} "${extra[@]}" "${WAF_URL}/"
}

log "Target: ${WAF_URL}"
log "Ensure demo rules applied: docker exec nginx-love-backend node /app/apps/api/dist/scripts/seed-waf-fingerprint-demo.js"
echo

# Baseline — curl should NOT be blocked (JA4H ge20n03… not in deny list)
CODE="$(http_code -A 'WAF-Test-Curl/1.0' --http2)"
if [[ "${CODE}" == "200" || "${CODE}" == "301" || "${CODE}" == "302" ]]; then
  pass "curl baseline returned ${CODE} (allowed)"
else
  fail "curl baseline returned ${CODE} (expected 200/3xx)"
fi

# Python requests
if command -v python3 >/dev/null 2>&1; then
  PY_CODE="$(python3 "${ROOT}/clients/python_requests.py" "${WAF_URL}" 2>/dev/null || echo 000)"
  if [[ "${PY_CODE}" == "403" ]]; then
    pass "python requests blocked (403)"
  else
    fail "python requests returned ${PY_CODE} (expected 403)"
  fi
else
  log "SKIP: python3 not installed"
fi

# Node fetch
if command -v node >/dev/null 2>&1; then
  NODE_CODE="$(node "${ROOT}/clients/nodejs_fetch.mjs" "${WAF_URL}" 2>/dev/null || echo 000)"
  if [[ "${NODE_CODE}" == "403" ]]; then
    pass "node fetch blocked (403)"
  else
    fail "node fetch returned ${NODE_CODE} (expected 403)"
  fi
else
  log "SKIP: node not installed — run: docker exec nginx-love-backend node /app/tests/waf-bot-block/clients/nodejs_fetch.mjs ${WAF_URL}"
  if docker exec nginx-love-backend test -f /app/tests/waf-bot-block/clients/nodejs_fetch.mjs 2>/dev/null; then
    NODE_CODE="$(docker exec nginx-love-backend node /app/tests/waf-bot-block/clients/nodejs_fetch.mjs "${WAF_URL}" 2>/dev/null || echo 000)"
    if [[ "${NODE_CODE}" == "403" ]]; then
      pass "node fetch (in container) blocked (403)"
    else
      fail "node fetch (in container) returned ${NODE_CODE} (expected 403)"
    fi
  fi
fi

echo
log "Results: ${PASS} passed, ${FAIL} failed"
[[ "${FAIL}" -eq 0 ]]
