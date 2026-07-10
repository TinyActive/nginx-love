#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IMAGE_TAG="${IMAGE_TAG:-local}"
BASE_IMAGE="${BASE_IMAGE:-nginx-love-base:${IMAGE_TAG}}"

build_base() {
  echo "Building nginx+ModSecurity+JA4 base image..."
  docker build -f docker/Dockerfile.base.nginx -t "nginx-love-base:${IMAGE_TAG}" .
  docker tag "nginx-love-base:${IMAGE_TAG}" "nginx-love-base:latest"
}

build_backend() {
  echo "Building backend image..."
  docker build -f docker/Dockerfile.backend \
    --pull=false \
    --build-arg "BASE_IMAGE=${BASE_IMAGE}" \
    -t "nginx-love-backend:${IMAGE_TAG}" .
}

build_frontend() {
  echo "Building frontend image..."
  docker build -f apps/web/Dockerfile \
    --build-arg "VITE_API_URL=${VITE_API_URL:-/api}" \
    --build-arg "BACKEND_URL=http://backend:3001" \
    -t "nginx-love-frontend:${IMAGE_TAG}" .
}

case "${1:-all}" in
  base) build_base ;;
  backend) build_backend ;;
  frontend|web) build_frontend ;;
  all)
    build_base
    build_backend
    build_frontend
    ;;
  *)
    echo "Usage: $0 {base|backend|frontend|all}"
    exit 1
    ;;
esac

echo "Done."
