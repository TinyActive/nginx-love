#!/bin/bash
set -euo pipefail

NGINX_PID=""
NODE_PID=""

shutdown() {
  echo "Shutting down..."
  if [ -n "${NODE_PID}" ] && kill -0 "${NODE_PID}" 2>/dev/null; then
    kill -TERM "${NODE_PID}" 2>/dev/null || true
    wait "${NODE_PID}" 2>/dev/null || true
  fi
  if [ -n "${NGINX_PID}" ] && kill -0 "${NGINX_PID}" 2>/dev/null; then
    nginx -s quit 2>/dev/null || kill -TERM "${NGINX_PID}" 2>/dev/null || true
    wait "${NGINX_PID}" 2>/dev/null || true
  fi
  exit 0
}

trap shutdown SIGTERM SIGINT

echo "Running database migrations..."
cd /app/apps/api
pnpm exec prisma migrate deploy

echo "Running safe seed (if applicable)..."
if node dist/scripts/seed-safe.js; then
  echo "Seed step completed"
else
  echo "WARN: seed-safe failed — check logs above"
fi

echo "Ensuring nginx directories..."
mkdir -p /etc/nginx/ssl /etc/nginx/sites-available /etc/nginx/sites-enabled \
  /etc/nginx/conf.d /etc/nginx/snippets /etc/nginx/bot-profiles \
  /var/www/html/.well-known/acme-challenge

if [ ! -f /etc/nginx/conf.d/acl-rules.conf ]; then
  cat > /etc/nginx/conf.d/acl-rules.conf <<'EOF'
# ACL Rules - Nginx Love UI
# This file will be populated with ACL rules

# No rules configured yet
EOF
fi

# Always sync base nginx.conf from image template (JA4 log formats, modules).
# Domain vhosts in sites-enabled/ are managed separately by the API.
cp /app/config/nginx.conf /etc/nginx/nginx.conf

echo "Testing nginx configuration..."
nginx -t

echo "Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

echo "Starting Node.js API..."
node /app/apps/api/dist/index.js &
NODE_PID=$!

wait "${NODE_PID}"
exit $?
