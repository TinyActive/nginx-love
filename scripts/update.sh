#!/bin/bash

################################################################################
# Nginx Love UI - Update Script
# Description: Update source code, rebuild and restart services
# Version: 1.0.0
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/apps/api"
FRONTEND_DIR="$PROJECT_DIR/apps/web"
LOG_FILE="/var/log/nginx-love-ui-update.log"

# shellcheck source=lib/vm-legacy.sh
source "${SCRIPT_DIR}/lib/vm-legacy.sh"

# Database configuration
DB_CONTAINER_NAME="nginx-love-postgres"

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [[ "${EUID}" -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

log "=================================="
log "Nginx Love UI Update Started"
log "=================================="

# Check if services exist
if ! systemctl list-unit-files | grep -q nginx-love-backend.service; then
    error "Backend service not found. Please run deploy.sh first."
fi

if ! systemctl list-unit-files | grep -q nginx-love-frontend.service; then
    error "Frontend service not found. Please run deploy.sh first."
fi

# Check if database container exists
if ! docker ps -a | grep -q "${DB_CONTAINER_NAME}"; then
    error "Database container '${DB_CONTAINER_NAME}' not found. Please run deploy.sh first."
fi

# Step 1: Check prerequisites
log "Step 1/7: Checking prerequisites..."

if ! command -v htpasswd &> /dev/null; then
    warn "htpasswd not found. Installing apache2-utils..."
    apt-get install -y apache2-utils >> "$LOG_FILE" 2>&1 || error "Failed to install apache2-utils"
    log "✓ htpasswd installed successfully"
else
    log "✓ htpasswd $(htpasswd -v 2>&1 | head -n1 | awk '{print $3}') detected"
fi


# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js not found. Please install Node.js 18+ first."
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    error "pnpm not found. Please install pnpm first."
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    error "Docker not found. Please install Docker first."
fi

log "✓ Prerequisites check passed"

# Step 2: Stop services before update
log "Step 2/7: Stopping services for update..."

# Stop nginx before core rebuild (if needed) and config swap
if systemctl is-active --quiet nginx 2>/dev/null; then
    systemctl stop nginx
    log "✓ Nginx stopped"
else
    warn "Nginx was not running"
fi

# Stop backend service
if systemctl is-active --quiet nginx-love-backend.service; then
    systemctl stop nginx-love-backend.service
    log "✓ Backend service stopped"
else
    warn "Backend service was not running"
fi

# Stop frontend service
if systemctl is-active --quiet nginx-love-frontend.service; then
    systemctl stop nginx-love-frontend.service
    log "✓ Frontend service stopped"
else
    warn "Frontend service was not running"
fi

# Step 3: Rebuild nginx core when bundled modules/version changed (preserves /etc/nginx sites + ModSecurity)
log "Step 3/7: Checking nginx core..."

if nginx_needs_core_upgrade "${PROJECT_DIR}"; then
    EXPECTED_NGINX_VERSION="$(get_expected_nginx_version "${PROJECT_DIR}/scripts/install-nginx-modsecurity.sh")"
    CURRENT_NGINX_VERSION="$(nginx -v 2>&1 | sed -n 's/.*nginx\/\([^ ]*\).*/\1/p' || echo 'not installed')"
    warn "Nginx core upgrade required (current: ${CURRENT_NGINX_VERSION}, expected: ${EXPECTED_NGINX_VERSION})"
    log "Rebuilding nginx + ModSecurity + JA4 modules (site configs and SSL files are preserved)..."
    upgrade_nginx_core "${PROJECT_DIR}" "${LOG_FILE}" || error "Failed to upgrade nginx core"
    log "✓ Nginx core upgraded to $(nginx -v 2>&1 | sed -n 's/.*nginx\/\([^ ]*\).*/\1/p')"
else
    log "✓ Nginx core is up to date"
fi

# Step 4: Update dependencies and build backend
log "Step 4/7: Building backend..."

cd "${PROJECT_DIR}"

# Update monorepo dependencies
log "Updating monorepo dependencies..."
pnpm install >> "${LOG_FILE}" 2>&1 || error "Failed to update monorepo dependencies"

cd "${BACKEND_DIR}"

# Start database if not running
if ! docker ps | grep -q "${DB_CONTAINER_NAME}" 2>/dev/null; then
    log "Starting database container..."
    docker start "${DB_CONTAINER_NAME}" 2>/dev/null || warn "Could not start database container"
    sleep 3
fi

# Generate Prisma client
log "Generating Prisma client..."
pnpm prisma generate >> "$LOG_FILE" 2>&1 || error "Failed to generate Prisma client"

# Run database migrations
log "Running database migrations..."
cd "${BACKEND_DIR}"
pnpm prisma migrate deploy >> "$LOG_FILE" 2>&1 || error "Failed to run migrations"

# Seed database safely (only create missing data, preserve existing)
log "Seeding database safely..."
cd "${BACKEND_DIR}"
pnpm ts-node prisma/seed-safe.ts >> "$LOG_FILE" 2>&1 || warn "Failed to seed database safely"

# Build backend (shared package must be built from monorepo root)
log "Building shared package..."
cd "${PROJECT_DIR}"
build_vm_backend "${PROJECT_DIR}" "${LOG_FILE}" || error "Failed to build backend"

log "✓ Backend build completed"

# Step 5: Build frontend
log "Step 5/7: Building frontend..."

cd "${FRONTEND_DIR}"

# Clean previous build
if [ -d "dist" ]; then
    log "Cleaning previous frontend build..."
    rm -rf dist
fi

# Build frontend (from monorepo root so workspace filters resolve correctly)
log "Building frontend..."
cd "${PROJECT_DIR}"
pnpm --filter @nginx-love/web build >> "${LOG_FILE}" 2>&1 || error "Failed to build frontend"

# Get public IP for CSP update
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || curl -s ipinfo.io/ip || echo "localhost")

# Update CSP in built index.html to use public IP
log "Updating Content Security Policy with public IP: ${PUBLIC_IP}..."
sed -i "s|__API_URL__|http://${PUBLIC_IP}:3001 http://localhost:3001|g" "${FRONTEND_DIR}/dist/index.html"
sed -i "s|__WS_URL__|ws://${PUBLIC_IP}:* ws://localhost:*|g" "${FRONTEND_DIR}/dist/index.html"

log "✓ Frontend build completed"

# Legacy VM: nginx on :8080 proxies /api (production frontend uses same-origin /api)
install_vm_frontend_nginx "${PROJECT_DIR}" "${LOG_FILE}"
log "✓ Frontend nginx proxy configured (port 8080 → API :3001)"

# Step 6: Restart services
log "Step 6/7: Starting services..."

# Database should already be running from Step 3, just verify
if ! docker ps | grep -q "${DB_CONTAINER_NAME}"; then
    error "Database container stopped unexpectedly. Please check Docker status."
else
    log "✓ Database container is running"
fi

# Start backend service
systemctl start nginx-love-backend.service || error "Failed to start backend service"
sleep 3
if ! systemctl is-active --quiet nginx-love-backend.service; then
    error "Backend service failed to start. Check logs: journalctl -u nginx-love-backend.service"
fi
log "✓ Backend service started"

# Start frontend service
systemctl start nginx-love-frontend.service || error "Failed to start frontend service"
sleep 3
if ! systemctl is-active --quiet nginx-love-frontend.service; then
    error "Frontend service failed to start. Check logs: journalctl -u nginx-love-frontend.service"
fi
log "✓ Frontend service started"

# Update nginx configuration
#backup existing nginx config
ORIGINAL_FILE_NGINX="/etc/nginx/nginx.conf"
BACKUP_FILE="${ORIGINAL_FILE_NGINX}.bak-$(date +%Y%m%d%H%M%S)"
if [ -f /etc/nginx/nginx.conf ]; then
    mv /etc/nginx/nginx.conf "${BACKUP_FILE}" || warn "Failed to backup existing nginx config"
    log "✓ Existing nginx config backed up"
fi
# copy new config
if [ ! -f "$PROJECT_DIR"/config/nginx.conf ]; then
    error "Nginx config file not found in $PROJECT_DIR/config/nginx.conf"
else
    log "✓ Nginx config file found"
    cp "$PROJECT_DIR"/config/nginx.conf "${ORIGINAL_FILE_NGINX}" || error "Failed to copy nginx config"
fi

# test nginx config
if ! nginx -t >> "$LOG_FILE" 2>&1; then
    # restore backup before exiting
    if [ -f "${BACKUP_FILE}" ]; then
        rm -f "${ORIGINAL_FILE_NGINX}"
        mv "${BACKUP_FILE}" "${ORIGINAL_FILE_NGINX}" || warn "Failed to restore nginx config from backup"
        log "✓ Nginx config restored from backup"
    fi
    error "Nginx configuration test failed. Check logs: tail -f $LOG_FILE"
else
    log "✓ Nginx configuration test passed"
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx || error "Failed to reload nginx"
    else
        systemctl start nginx || error "Failed to start nginx"
    fi
fi

# Ensure nginx is running
if ! systemctl is-active --quiet nginx; then
    systemctl start nginx || error "Failed to start nginx"
fi
log "✓ Nginx is running"

# Step 7: Health check and summary
log "Step 7/7: Performing health checks..."

# Health check with retries
log "Performing health checks..."
sleep 5

# Backend health check (via frontend /api proxy, same as Docker)
BACKEND_HEALTHY=false
for i in {1..10}; do
    if curl -s http://localhost:8080/api/health | grep -q "success"; then
        BACKEND_HEALTHY=true
        break
    fi
    sleep 2
done

if [ "$BACKEND_HEALTHY" = true ]; then
    log "✅ Backend health check: PASSED"
else
    warn "⚠️  Backend health check: FAILED (check logs: tail -f /var/log/nginx-love-backend.log)"
fi

# Frontend health check
FRONTEND_HEALTHY=false
for i in {1..5}; do
    if curl -s http://localhost:8080 | grep -q "<!doctype html"; then
        FRONTEND_HEALTHY=true
        break
    fi
    sleep 2
done

if [ "$FRONTEND_HEALTHY" = true ]; then
    log "✅ Frontend health check: PASSED"
else
    warn "⚠️  Frontend health check: FAILED (check logs: tail -f /var/log/nginx-love-frontend.log)"
fi

# Final Summary
log ""
log "=================================="
log "Update Completed Successfully!"
log "=================================="
log ""
log "📋 Updated Components:"
log "  • Nginx core: Rebuilt when required modules/version changed"
log "  • Backend API: Rebuilt and restarted"
log "  • Frontend UI: Rebuilt and restarted"
log "  • Database: Migrations applied, missing data created (existing data preserved)"
log ""
log "🌐 Services Status:"
log "  • Backend API: http://${PUBLIC_IP}:3001"
log "  • Frontend UI: http://${PUBLIC_IP}:8080"
log "  • Database: Running in Docker container"
log ""
log "📝 Manage Services:"
log "  Backend:    systemctl {start|stop|restart|status} nginx-love-backend"
log "  Frontend:   systemctl {start|stop|restart|status} nginx-love-frontend"
log "  Database:   docker {start|stop|restart} ${DB_CONTAINER_NAME}"
log ""
log "📊 View Logs:"
log "  Backend:    tail -f /var/log/nginx-love-backend.log"
log "  Frontend:   tail -f /var/log/nginx-love-frontend.log"
log "  Database:   docker logs -f ${DB_CONTAINER_NAME}"
log "  Update:     tail -f ${LOG_FILE}"
log ""
if command -v docker &>/dev/null && docker compose version &>/dev/null 2>&1; then
  log "💡 Docker is available — consider migrating to Compose: sudo bash scripts/migrate-vm-to-docker.sh"
fi
log ""
log "🔐 Access the portal at: http://${PUBLIC_IP}:8080"
log ""
log "Update log saved to: ${LOG_FILE}"
log "=================================="
