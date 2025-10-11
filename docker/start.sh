#!/bin/bash
set -e

echo "🧹 Cleaning up old nginx PID if exists..."
rm -f /var/run/nginx.pid

echo "🚀 Starting Nginx..."
nginx -g "daemon off;" &

echo "🟢 Starting Node.js API..."
node /app/apps/api/dist/index.js
