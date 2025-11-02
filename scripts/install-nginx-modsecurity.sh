#!/bin/bash

################################################################################
# Nginx + ModSecurity Installation Script
# Description: Installs Nginx with ModSecurity from source in background
# Log file: /var/log/nginx-modsecurity-install.log
################################################################################

set -e

# Configuration
NGINX_VERSION="1.28.0"
MODSECURITY_VERSION="3.0.14"
MODSECURITY_NGINX_VERSION="1.0.4"
INSTALL_LOG="/var/log/nginx-modsecurity-install.log"
INSTALL_STATUS_FILE="/var/run/nginx-modsecurity-install.status"
NGINX_CONFIG_DIR="/etc/nginx"
MODSECURITY_CONFIG_DIR="/etc/nginx/modsec"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${INSTALL_LOG}"
}

# Update status file
update_status() {
    local step=$1
    local status=$2
    local message=$3
    echo "{\"step\":\"${step}\",\"status\":\"${status}\",\"message\":\"${message}\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "${INSTALL_STATUS_FILE}"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    update_status "error" "failed" "$1"
    exit 1
}

# Check if running as root
if [[ "${EUID}" -ne 0 ]]; then
   error_exit "This script must be run as root"
fi

log "================================================"
log "Nginx + ModSecurity Installation Started"
log "================================================"

# Step 1: Install dependencies
log "Step 1/8: Installing dependencies..."
update_status "dependencies" "running" "Installing required packages..."

apt-get update >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to update package list"

apt-get install -y \
    build-essential \
    libpcre3 \
    libpcre3-dev \
    zlib1g \
    zlib1g-dev \
    libssl-dev \
    libgd-dev \
    libgeoip-dev \
    libxml2 \
    libxml2-dev \
    libyajl-dev \
    liblmdb-dev \
    libcurl4-openssl-dev \
    libtool \
    automake \
    autoconf \
    git \
    wget \
    >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to install dependencies"

log "Dependencies installed successfully"
update_status "dependencies" "completed" "All dependencies installed"

# Step 2: Download ModSecurity
log "Step 2/8: Downloading ModSecurity v${MODSECURITY_VERSION}..."
update_status "modsecurity_download" "running" "Downloading ModSecurity..."

cd /usr/local/src
if [ ! -d "ModSecurity" ]; then
    git clone --depth 1 -b v${MODSECURITY_VERSION} --single-branch https://github.com/owasp-modsecurity/ModSecurity >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to clone ModSecurity"
fi

log "ModSecurity downloaded successfully"
update_status "modsecurity_download" "completed" "ModSecurity downloaded"

# Step 3: Build ModSecurity
log "Step 3/8: Building ModSecurity..."
update_status "modsecurity_build" "running" "Compiling ModSecurity (this may take 10-15 minutes)..."

cd ModSecurity
git submodule init >> "${INSTALL_LOG}" 2>&1
git submodule update >> "${INSTALL_LOG}" 2>&1
./build.sh >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to build ModSecurity"
./configure >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to configure ModSecurity"
make -j$(nproc) >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to compile ModSecurity"
make install >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to install ModSecurity"

log "ModSecurity built and installed successfully"
update_status "modsecurity_build" "completed" "ModSecurity compiled and installed"

# Step 4: Download ModSecurity-nginx connector
log "Step 4/8: Downloading ModSecurity-nginx connector..."
update_status "connector_download" "running" "Downloading ModSecurity-nginx connector..."

cd /usr/local/src
if [ ! -d "ModSecurity-nginx" ]; then
    git clone --depth 1 https://github.com/owasp-modsecurity/ModSecurity-nginx.git >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to clone ModSecurity-nginx"
fi

log "ModSecurity-nginx connector downloaded"
update_status "connector_download" "completed" "Connector downloaded"

# Step 5: Download Nginx
log "Step 5/8: Downloading Nginx v${NGINX_VERSION}..."
update_status "nginx_download" "running" "Downloading Nginx..."

cd /usr/local/src
if [ ! -f "nginx-${NGINX_VERSION}.tar.gz" ]; then
    wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to download Nginx"
    tar -xzf nginx-${NGINX_VERSION}.tar.gz >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to extract Nginx"
fi

log "Nginx downloaded successfully"
update_status "nginx_download" "completed" "Nginx downloaded"

# Step 6: Build Nginx with ModSecurity
log "Step 6/8: Building Nginx with ModSecurity..."
update_status "nginx_build" "running" "Compiling Nginx (this may take 5-10 minutes)..."

cd nginx-${NGINX_VERSION}
./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --user=www-data \
    --group=www-data \
    --with-http_ssl_module \
    --with-http_v2_module \
    --with-http_realip_module \
    --with-http_addition_module \
    --with-http_sub_module \
    --with-http_dav_module \
    --with-http_flv_module \
    --with-http_mp4_module \
    --with-http_gunzip_module \
    --with-http_gzip_static_module \
    --with-http_random_index_module \
    --with-http_secure_link_module \
    --with-http_stub_status_module \
    --with-http_auth_request_module \
    --with-http_geoip_module \
    --with-threads \
    --with-stream \
    --with-stream_ssl_module \
    --with-stream_realip_module \
    --with-stream_geoip_module \
    --with-http_slice_module \
    --with-file-aio \
    --add-dynamic-module=/usr/local/src/ModSecurity-nginx \
    >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to configure Nginx"

make -j$(nproc) >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to compile Nginx"
make install >> "${INSTALL_LOG}" 2>&1 || error_exit "Failed to install Nginx"

# Copy ModSecurity dynamic module to nginx modules directory
mkdir -p /usr/lib/nginx/modules
cp objs/ngx_http_modsecurity_module.so /usr/lib/nginx/modules/ || error_exit "Failed to copy ModSecurity module"
log "ModSecurity module copied to /usr/lib/nginx/modules/"

log "Nginx built and installed successfully"
update_status "nginx_build" "completed" "Nginx compiled and installed"

# Step 7: Configure ModSecurity
log "Step 7/8: Configuring ModSecurity..."
update_status "modsecurity_config" "running" "Setting up ModSecurity configuration..."

# Create ModSecurity directories
mkdir -p "${MODSECURITY_CONFIG_DIR}"
mkdir -p /var/log/modsec

# Copy ModSecurity configuration
cp /usr/local/src/ModSecurity/modsecurity.conf-recommended "${MODSECURITY_CONFIG_DIR}/modsecurity.conf"
cp /usr/local/src/ModSecurity/unicode.mapping "${MODSECURITY_CONFIG_DIR}/"

# Enable ModSecurity
sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' "${MODSECURITY_CONFIG_DIR}/modsecurity.conf"

# Download OWASP Core Rule Set
cd "${MODSECURITY_CONFIG_DIR}"
if [ ! -d "coreruleset" ]; then
    git clone https://github.com/coreruleset/coreruleset.git >> "${INSTALL_LOG}" 2>&1
    cd coreruleset
    mv crs-setup.conf.example crs-setup.conf
fi

# Create main ModSecurity configuration
cat > "${MODSECURITY_CONFIG_DIR}/main.conf" << 'EOF'
Include /etc/nginx/modsec/modsecurity.conf
Include /etc/nginx/modsec/coreruleset/crs-setup.conf
Include /etc/nginx/modsec/coreruleset/rules/*.conf
EOF

log "ModSecurity configured successfully"
update_status "modsecurity_config" "completed" "ModSecurity rules configured"

# Step 8: Create Nginx configuration
log "Step 8/8: Creating Nginx configuration..."
update_status "nginx_config" "running" "Setting up Nginx configuration..."

# Create directories
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
mkdir -p /etc/nginx/snippets
mkdir -p /var/www/html
mkdir -p /var/log/nginx

# Create nginx.conf
cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
pid /var/run/nginx.pid;
load_module /usr/lib/nginx/modules/ngx_http_modsecurity_module.so;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    ##
    # Basic Settings
    ##
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    client_max_body_size 100M;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ##
    # SSL Settings
    ##
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

    ##
    # Logging Settings
    ##
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    ##
    # Gzip Settings
    ##
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    ##
    # ModSecurity Settings
    ##
    modsecurity on;
    modsecurity_rules_file /etc/nginx/modsec/main.conf;

    ##
    # Virtual Host Configs
    ##
    include /etc/nginx/sites-enabled/*;
}
EOF

# Create default server
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
EOF

ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Create default index.html
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Nginx + ModSecurity</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        h1 { color: #009639; }
        .info { background: #f0f0f0; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Welcome to Nginx + ModSecurity</h1>
    <div class="info">
        <p><strong>Status:</strong> Running</p>
        <p><strong>ModSecurity:</strong> Enabled</p>
        <p><strong>Version:</strong> Nginx 1.24.0 with ModSecurity 3.0.12</p>
    </div>
</body>
</html>
EOF

# Set permissions
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# Create systemd service
cat > /etc/systemd/system/nginx.service << 'EOF'
[Unit]
Description=The NGINX HTTP and reverse proxy server
After=syslog.target network-online.target remote-fs.target nss-lookup.target
Wants=network-online.target

[Service]
Type=forking
PIDFile=/var/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t
ExecStart=/usr/sbin/nginx
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Enable and start nginx
systemctl daemon-reload
systemctl enable nginx >> "${INSTALL_LOG}" 2>&1
systemctl start nginx >> "${INSTALL_LOG}" 2>&1

# Test nginx
if nginx -t >> "${INSTALL_LOG}" 2>&1; then
    log "Nginx configuration test passed"
else
    error_exit "Nginx configuration test failed"
fi

log "Nginx configuration completed"
update_status "nginx_config" "completed" "Nginx configured and started"

# Final status
log "================================================"
log "Installation completed successfully!"
log "================================================"
log "Nginx version: $(nginx -v 2>&1)"
log "ModSecurity: Enabled"
log "Configuration: /etc/nginx"
log "Logs: /var/log/nginx"
log "================================================"

update_status "completed" "success" "Nginx + ModSecurity installed and running successfully"

echo -e "${GREEN}✓ Installation completed successfully!${NC}"
echo -e "Nginx with ModSecurity is now running"
echo -e "Access: http://localhost"
echo -e "Status: http://localhost/nginx_status (from localhost only)"
echo -e "Logs: tail -f /var/log/nginx-modsecurity-install.log"