#!/bin/bash

################################################################################
# Nginx Love UI - Complete Deployment Script
# Description: Deploy Backend + Frontend + Nginx + ModSecurity
# Version: 2.0.0
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
LOG_FILE="/var/log/nginx-love-ui-deploy.log"
DB_DIR="$BACKEND_DIR/prisma"

# Security configuration
JWT_ACCESS_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Logging
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

# Check root
if [[ "${EUID}" -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

log "=================================="
log "Nginx Love UI Deployment Started"
log "=================================="

# Get server public IP
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || curl -s ipinfo.io/ip || echo "localhost")
log "Detected Public IP: $PUBLIC_IP"

# Step 1: Check Prerequisites
log "Step 1/8: Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    warn "Node.js not found. Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >> "$LOG_FILE" 2>&1 || error "Failed to download Node.js setup script"
    apt-get install -y nodejs >> "$LOG_FILE" 2>&1 || error "Failed to install Node.js"
    log "✓ Node.js $(node -v) installed successfully"
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "${NODE_VERSION}" -lt 18 ]; then
        warn "Node.js version too old ($(node -v)). Upgrading to 20.x..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >> "$LOG_FILE" 2>&1
        apt-get install -y nodejs >> "$LOG_FILE" 2>&1 || error "Failed to upgrade Node.js"
        log "✓ Node.js upgraded to $(node -v)"
    else
        log "✓ Node.js $(node -v) detected"
    fi
fi

if ! comannd -v htpasswd &> /dev/null; then
    warn "htpasswd not found. Installing apache2-utils..."
    apt-get install -y apache2-utils >> "$LOG_FILE" 2>&1 || error "Failed to install apache2-utils"
    log "✓ htpasswd installed successfully"
else
    log "✓ htpasswd $(htpasswd -v 2>&1 | head -n1 | awk '{print $3}') detected"
fi


# Check npm (ensure it's installed)
if ! command -v npm &> /dev/null; then
    warn "npm not found. Installing npm..."
    apt-get install -y npm >> "$LOG_FILE" 2>&1 || error "Failed to install npm"
    log "✓ npm $(npm -v) installed successfully"
else
    log "✓ npm $(npm -v) detected"
fi

# Check pnpm (required for monorepo)
if ! command -v pnpm &> /dev/null; then
    warn "pnpm not found. Installing pnpm..."
    npm install -g pnpm@8.15.0 >> "$LOG_FILE" 2>&1 || error "Failed to install pnpm"
    log "✓ pnpm $(pnpm -v) installed successfully"
else
    PNPM_VERSION=$(pnpm -v | cut -d'.' -f1)
    if [ "${PNPM_VERSION}" -lt 8 ]; then
        warn "pnpm version too old ($(pnpm -v)). Upgrading to 8.15.0..."
        npm install -g pnpm@8.15.0 >> "$LOG_FILE" 2>&1 || error "Failed to upgrade pnpm"
        log "✓ pnpm upgraded to $(pnpm -v)"
    else
        log "✓ pnpm $(pnpm -v) detected"
    fi
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    warn "Docker not found. Installing latest Docker..."
    curl -fsSL https://get.docker.com -o /tmp/install-docker.sh >> "$LOG_FILE" 2>&1 || error "Failed to download Docker installer"
    sh /tmp/install-docker.sh >> "$LOG_FILE" 2>&1 || error "Failed to install Docker"
    rm -f /tmp/install-docker.sh
    
    # Start Docker service
    systemctl start docker >> "$LOG_FILE" 2>&1
    systemctl enable docker >> "$LOG_FILE" 2>&1
    
    log "✓ Docker $(docker -v | cut -d',' -f1 | cut -d' ' -f3) installed successfully"
else
    log "✓ Docker $(docker -v | cut -d',' -f1 | cut -d' ' -f3) detected"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    warn "Docker Compose not found. Installing latest version..."
    
    # Get latest docker compose released tag
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    if [ -z "$COMPOSE_VERSION" ]; then
        warn "Failed to get latest version, using v2.24.0"
        COMPOSE_VERSION="v2.24.0"
    fi
    
    # Install docker-compose
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose >> "$LOG_FILE" 2>&1 || error "Failed to download Docker Compose"
    
    chmod +x /usr/local/bin/docker-compose
    
    # Install bash completion
    curl -L "https://raw.githubusercontent.com/docker/compose/${COMPOSE_VERSION}/contrib/completion/bash/docker-compose" \
        -o /etc/bash_completion.d/docker-compose 2>/dev/null || true
    
    log "✓ Docker Compose $(docker-compose -v | cut -d' ' -f4 | tr -d ',') installed successfully"
else
    log "✓ Docker Compose $(docker-compose -v | cut -d' ' -f4 | tr -d ',') detected"
fi

# Use pnpm for monorepo
PKG_MANAGER="pnpm"
log "✓ Package manager: ${PKG_MANAGER}"

# Step 2: Setup SQLite Database
log "Step 2/8: Setting up SQLite Database..."

# Create database directory if it doesn't exist
mkdir -p "${DB_DIR}"
log "✓ Database directory created at ${DB_DIR}"
log "✓ SQLite database will be created at ${DB_DIR}/nginx_waf.db"
log "  • No Docker container required"
log "  • No PostgreSQL installation required"

# Step 3: Install Nginx + ModSecurity
log "Step 3/8: Installing Nginx + ModSecurity..."

if ! command -v nginx &> /dev/null; then
    info "Nginx not found. Installing..."
    bash "${PROJECT_DIR}/scripts/install-nginx-modsecurity.sh" || error "Failed to install Nginx + ModSecurity"
    log "✓ Nginx + ModSecurity installed"
else
    log "✓ Nginx already installed ($(nginx -v 2>&1 | cut -d'/' -f2))"
fi

# Step 4: Setup Backend
log "Step 4/8: Setting up Backend..."

# Install root dependencies first (for monorepo)
cd "${PROJECT_DIR}"
if [ ! -d "node_modules" ]; then
    log "Installing monorepo dependencies..."
    "${PKG_MANAGER}" install >> "${LOG_FILE}" 2>&1 || error "Failed to install monorepo dependencies"
else
    log "✓ Monorepo dependencies already installed"
fi

cd "${BACKEND_DIR}"

# Create backend .env from .env.example (always create fresh)
log "Creating fresh backend .env from .env.example..."
cat > ".env" <<EOF
# Database Configuration - SQLite (file-based, no server needed)
DATABASE_URL="file:./nginx_waf.db"

# Server Configuration
PORT=3001
NODE_ENV="production"

# JWT Configuration
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration (comma-separated origins)
CORS_ORIGIN="http://${PUBLIC_IP}:8080,http://localhost:8080,http://localhost:5173,http://${PUBLIC_IP},http://localhost"

# Security
BCRYPT_ROUNDS=10

# Session
SESSION_SECRET="${SESSION_SECRET}"

# 2FA
TWO_FACTOR_APP_NAME="Nginx Love UI"

# SSL Configuration
SSL_DIR="/etc/nginx/ssl"
ACME_DIR="/var/www/html/.well-known/acme-challenge"

# SMTP Configuration
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="user@example.com"
SMTP_PASS="change-this-to-random-password"
EOF

log "✅ Created fresh backend .env"

log "✓ Backend .env configured with:"
log "  • Database: SQLite (file-based at ${DB_DIR}/nginx_waf.db)"
log "  • CORS Origins: ${PUBLIC_IP}, localhost"
log "  • JWT Secrets: Generated (64 chars each)"

# Generate Prisma Client
log "Generating Prisma client..."
pnpm prisma:generate >> "$LOG_FILE" 2>&1 || error "Failed to generate Prisma client"

# Run migrations
log "Running database migrations..."
pnpm exec prisma migrate deploy >> "$LOG_FILE" 2>&1 || error "Failed to run migrations"

# Force reseed database after fresh installation
log "Seeding database..."
rm -f .seeded  # Remove marker to force reseed
pnpm prisma:seed >> "$LOG_FILE" 2>&1 || warn "Failed to seed database"
touch .seeded

log "✓ Backend setup completed"

# Step 5: Build Backend
log "Step 5/8: Building Backend..."
cd "${PROJECT_DIR}"
pnpm --filter @nginx-love/api build >> "${LOG_FILE}" 2>&1 || error "Failed to build backend"
log "✓ Backend built successfully"

# Step 6: Setup Frontend
log "Step 6/8: Setting up Frontend..."

cd "${FRONTEND_DIR}"

# Create frontend .env from .env.example (always create fresh)
log "Creating fresh frontend .env from .env.example..."
cat > ".env" <<EOF
VITE_API_URL=http://${PUBLIC_IP}:3001/api
EOF

log "✅ Created fresh frontend .env"

log "✓ Frontend .env configured with API: http://${PUBLIC_IP}:3001/api"

# Clean previous build
if [ -d "dist" ]; then
    log "Cleaning previous build..."
    rm -rf dist
fi

# Build frontend
log "Building frontend..."
cd "${PROJECT_DIR}"
pnpm --filter @nginx-love/web build >> "${LOG_FILE}" 2>&1 || error "Failed to build frontend"

# Update CSP in built index.html to use public IP
log "Updating Content Security Policy with public IP..."
sed -i "s|__API_URL__|http://${PUBLIC_IP}:3001 http://localhost:3001|g" "${FRONTEND_DIR}/dist/index.html"
sed -i "s|__WS_URL__|ws://${PUBLIC_IP}:* ws://localhost:*|g" "${FRONTEND_DIR}/dist/index.html"

log "✓ Frontend built successfully"
log "✓ CSP configured for: http://${PUBLIC_IP}:3001, http://localhost:3001"

# Step 7: Setup Nginx Configuration
log "Step 7/8: Configuring Nginx..."

# Create required directories
mkdir -p /etc/nginx/ssl
mkdir -p /etc/nginx/conf.d
mkdir -p /etc/nginx/snippets
mkdir -p /var/www/html/.well-known/acme-challenge
chmod -R 755 /var/www/html/.well-known
touch /etc/nginx/conf.d/acl-rules.conf

# Create ACME challenge snippet if not exists
if [ ! -f "/etc/nginx/snippets/acme-challenge.conf" ]; then
    cat > /etc/nginx/snippets/acme-challenge.conf <<'EOF'
# ACME Challenge for Let's Encrypt
location ^~ /.well-known/acme-challenge/ {
    default_type "text/plain";
    root /var/www/html;
    allow all;
}

location = /.well-known/acme-challenge/ {
    return 404;
}
EOF
    log "✓ ACME challenge snippet created"
fi

# Setup systemd services
log "Setting up systemd services..."

# Backend service
cat > /etc/systemd/system/nginx-love-backend.service <<EOF
[Unit]
Description=Nginx Love UI Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${BACKEND_DIR}
Environment=NODE_ENV=production
ExecStart=$(which node) dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/nginx-love-backend.log
StandardError=append:/var/log/nginx-love-backend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Frontend service (if using preview mode)
cat > /etc/systemd/system/nginx-love-frontend.service <<EOF
[Unit]
Description=Nginx Love UI Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${FRONTEND_DIR}
Environment=NODE_ENV=production
ExecStart=$(which pnpm) preview --host 0.0.0.0 --port 8080
Restart=always
RestartSec=10
StandardOutput=append:/var/log/nginx-love-frontend.log
StandardError=append:/var/log/nginx-love-frontend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable services
systemctl enable nginx-love-backend.service >> "$LOG_FILE" 2>&1
systemctl enable nginx-love-frontend.service >> "$LOG_FILE" 2>&1

log "✓ Systemd services configured"

# Step 8: Start Services
log "Step 8/8: Starting services..."

# Start backend
systemctl restart nginx-love-backend.service || error "Failed to start backend service"
sleep 2
if ! systemctl is-active --quiet nginx-love-backend.service; then
    error "Backend service failed to start. Check logs: journalctl -u nginx-love-backend.service"
fi
log "✓ Backend service started"

# Start frontend
systemctl restart nginx-love-frontend.service || error "Failed to start frontend service"
sleep 2
if ! systemctl is-active --quiet nginx-love-frontend.service; then
    error "Frontend service failed to start. Check logs: journalctl -u nginx-love-frontend.service"
fi
log "✓ Frontend service started"

# Ensure nginx is running
if ! systemctl is-active --quiet nginx; then
    # Fix IPv6 issue if present
    if nginx -t 2>&1 | grep -q "Address family not supported"; then
        log "Fixing IPv6 configuration..."
        sed -i 's/listen \[::\]:80/# listen [::]:80/g' /etc/nginx/sites-available/default 2>/dev/null || true
        sed -i 's/listen \[::\]:443/# listen [::]:443/g' /etc/nginx/sites-available/default 2>/dev/null || true
        sed -i 's/listen \[::\]:80/# listen [::]:80/g' /etc/nginx/sites-enabled/*.conf 2>/dev/null || true
        sed -i 's/listen \[::\]:443/# listen [::]:443/g' /etc/nginx/sites-enabled/*.conf 2>/dev/null || true
    fi
    
    systemctl start nginx || error "Failed to start nginx"
fi
# Configure Nginx
log "Configuring Nginx with custom settings..."
cd "${PROJECT_DIR}"

# Check if custom config exists
if [ ! -f "config/nginx.conf" ]; then
    error "Custom Nginx configuration not found at ${PROJECT_DIR}/config/nginx.conf"
fi

# Create backup with timestamp
BACKUP_FILE="/etc/nginx/nginx.conf.bak-$(date +%Y%m%d%H%M%S)"
if ! cp -f /etc/nginx/nginx.conf "${BACKUP_FILE}" 2>/dev/null; then
    warn "Failed to create backup of original Nginx config"
else
    log "Created backup of original config at ${BACKUP_FILE}"
fi

# Copy custom config
if ! cp -f config/nginx.conf /etc/nginx/nginx.conf; then
    error "Failed to copy custom Nginx configuration"
fi

# Test nginx configuration
if nginx -t >> "$LOG_FILE" 2>&1; then
    log "✓ Nginx configuration test passed"
    
    # Reload nginx to apply changes
    if systemctl reload nginx >> "$LOG_FILE" 2>&1; then
        log "✓ Nginx configuration reloaded successfully"
    else
        warn "Failed to reload Nginx, attempting restart"
        systemctl restart nginx >> "$LOG_FILE" 2>&1
    fi
else
    warn "Nginx configuration test failed, reverting to backup"
    cp -f "${BACKUP_FILE}" /etc/nginx/nginx.conf
    
    # Log the specific error for troubleshooting
    echo -e "${RED}Nginx configuration error:${NC}" | tee -a "$LOG_FILE"
    nginx -t 2>&1 | tee -a "$LOG_FILE"
    
    warn "Reverted to original configuration"
fi

log "✓ Nginx running"

# Final Summary
log ""
log "=================================="
log "Deployment Completed Successfully!"
log "=================================="
log ""
log "📋 Service Status:"
log "  • Database: SQLite (file-based at ${DB_DIR}/nginx_waf.db)"
log "  • Backend API: http://${PUBLIC_IP}:3001"
log "  • Frontend UI: http://${PUBLIC_IP}:8080"
log "  • Nginx: Port 80/443"
log ""
log "🔑 Security Keys:"
log "  • JWT Access Secret: ${JWT_ACCESS_SECRET}"
log "  • JWT Refresh Secret: ${JWT_REFRESH_SECRET}"
log "  • Session Secret: ${SESSION_SECRET}"
log ""
log "📝 Manage Services:"
log "  Backend:    systemctl {start|stop|restart|status} nginx-love-backend"
log "  Frontend:   systemctl {start|stop|restart|status} nginx-love-frontend"
log "  Nginx:      systemctl {start|stop|restart|status} nginx"
log ""
log "📊 View Logs:"
log "  Backend:    tail -f /var/log/nginx-love-backend.log"
log "  Frontend:   tail -f /var/log/nginx-love-frontend.log"
log "  Nginx:      tail -f /var/log/nginx/error.log"
log ""
log "🔐 Default Credentials:"
log "  Username: admin"
log "  Password: admin123"
log ""
log "🌐 Access the portal at: http://${PUBLIC_IP}:8080"
log ""

# Save credentials to file
cat > /root/.nginx-love-credentials <<EOF
# Nginx Love UI - Deployment Credentials
# Generated: $(date)

## Public Access
Frontend: http://${PUBLIC_IP}:8080
Backend:  http://${PUBLIC_IP}:3001

## Database (SQLite)
Database File: ${DB_DIR}/nginx_waf.db
Note: No PostgreSQL/Docker container required

## Security Keys
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
SESSION_SECRET=${SESSION_SECRET}

## Default Login
Username: admin
Password: admin123

## Backup Database
To backup: cp ${DB_DIR}/nginx_waf.db ${DB_DIR}/nginx_waf.db.backup
To restore: cp ${DB_DIR}/nginx_waf.db.backup ${DB_DIR}/nginx_waf.db
EOF

chmod 600 /root/.nginx-love-credentials
log "💾 Credentials saved to: /root/.nginx-love-credentials"

# Health check
sleep 3
if curl -s http://localhost:3001/api/health | grep -q "success"; then
    log "✅ Backend health check: PASSED"
else
    warn "⚠️  Backend health check: FAILED (may need a moment to start)"
fi

if curl -s http://localhost:8080 | grep -q "<!doctype html"; then
    log "✅ Frontend health check: PASSED"
else
    warn "⚠️  Frontend health check: FAILED (may need a moment to start)"
fi

log ""
log "Deployment log saved to: ${LOG_FILE}"
log "=================================="