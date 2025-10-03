# ============================================================================
# Stage 1: Build ModSecurity and Nginx with ModSecurity module
# ============================================================================
FROM debian:bullseye-slim AS nginx-builder

# Versions
ENV NGINX_VERSION=1.24.0 \
    MODSECURITY_VERSION=3.0.12 \
    OWASP_CRS_VERSION=4.0.0

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpcre3-dev \
    zlib1g-dev \
    libssl-dev \
    libgd-dev \
    libgeoip-dev \
    libxml2-dev \
    libyajl-dev \
    liblmdb-dev \
    libcurl4-openssl-dev \
    libtool \
    automake \
    autoconf \
    git \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Build ModSecurity
WORKDIR /usr/local/src
RUN git clone --depth 1 -b v${MODSECURITY_VERSION} https://github.com/SpiderLabs/ModSecurity \
    && cd ModSecurity \
    && git submodule init \
    && git submodule update \
    && ./build.sh \
    && ./configure \
    && make -j$(nproc) \
    && make install

# Download ModSecurity-nginx connector
RUN git clone --depth 1 https://github.com/SpiderLabs/ModSecurity-nginx.git

# Build Nginx with ModSecurity module
RUN wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz \
    && tar -xzf nginx-${NGINX_VERSION}.tar.gz \
    && cd nginx-${NGINX_VERSION} \
    && ./configure \
        --prefix=/etc/nginx \
        --sbin-path=/usr/sbin/nginx \
        --modules-path=/usr/lib/nginx/modules \
        --conf-path=/etc/nginx/nginx.conf \
        --error-log-path=/var/log/nginx/error.log \
        --http-log-path=/var/log/nginx/access.log \
        --pid-path=/run/nginx.pid \
        --lock-path=/run/nginx.lock \
        --user=node \
        --group=node \
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
    && make -j$(nproc) \
    && make install

# Copy ModSecurity module
RUN mkdir -p /usr/lib/nginx/modules \
    && cp /usr/local/src/nginx-${NGINX_VERSION}/objs/ngx_http_modsecurity_module.so /usr/lib/nginx/modules/

# ============================================================================
# Stage 2: Final development image with Node.js and Nginx + ModSecurity
# ============================================================================
FROM node:20-bullseye

# Install runtime dependencies and systemd
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    systemd \
    systemd-sysv \
    git \
    curl \
    wget \
    ca-certificates \
    zsh \
    sudo \
    openssl \
    postgresql-client \
    # Runtime dependencies for nginx + modsecurity
    libpcre3 \
    zlib1g \
    libssl1.1 \
    libgd3 \
    libgeoip1 \
    libxml2 \
    libyajl2 \
    liblmdb0 \
    libcurl4 \
    # For better terminal experience
    vim \
    nano \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Copy nginx and ModSecurity from builder stage
COPY --from=nginx-builder /usr/sbin/nginx /usr/sbin/nginx
COPY --from=nginx-builder /usr/lib/nginx /usr/lib/nginx
COPY --from=nginx-builder /etc/nginx /etc/nginx
COPY --from=nginx-builder /usr/local/modsecurity /usr/local/modsecurity

# Create systemd service for nginx
RUN cat > /etc/systemd/system/nginx.service <<'EOF'
[Unit]
Description=The NGINX HTTP and reverse proxy server
After=syslog.target network-online.target remote-fs.target nss-lookup.target
Wants=network-online.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t
ExecStart=/usr/sbin/nginx
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Enable nginx service
RUN systemctl enable nginx

# Install pnpm globally
RUN npm install -g pnpm@8.15.0

RUN touch /etc/nginx/conf.d/acl-rules.conf

# Setup ModSecurity configuration directories
RUN mkdir -p /etc/nginx/modsec /var/log/modsec

# Download and setup OWASP Core Rule Set
WORKDIR /etc/nginx/modsec
RUN git clone --depth 1 -b v${OWASP_CRS_VERSION:-4.0.0} https://github.com/coreruleset/coreruleset.git \
    && cd coreruleset \
    && mv crs-setup.conf.example crs-setup.conf

# Create ModSecurity configuration files
RUN cat > /etc/nginx/modsec/modsecurity.conf <<'EOF'
# ModSecurity Configuration
SecRuleEngine On
SecRequestBodyAccess On
SecRequestBodyLimit 13107200
SecRequestBodyNoFilesLimit 131072
SecRequestBodyLimitAction Reject
SecPcreMatchLimit 1000
SecPcreMatchLimitRecursion 1000

SecResponseBodyAccess On
SecResponseBodyMimeType text/plain text/html text/xml
SecResponseBodyLimit 524288
SecResponseBodyLimitAction ProcessPartial

SecTmpDir /tmp/
SecDataDir /tmp/

SecAuditEngine RelevantOnly
SecAuditLogRelevantStatus "^(?:5|4(?!04))"
SecAuditLogParts ABIJDEFHZ
SecAuditLogType Serial
SecAuditLog /var/log/modsec/modsec_audit.log

SecArgumentSeparator &
SecCookieFormat 0
SecUnicodeMapFile /etc/nginx/modsec/unicode.mapping 20127

SecStatusEngine On
EOF

# Create unicode mapping file
RUN cat > /etc/nginx/modsec/unicode.mapping <<'EOF'
# Unicode mapping file for ModSecurity
# This is a minimal version for development
EOF

# Create main ModSecurity rules file
RUN cat > /etc/nginx/modsec/main.conf <<'EOF'
Include /etc/nginx/modsec/modsecurity.conf
Include /etc/nginx/modsec/coreruleset/crs-setup.conf
Include /etc/nginx/modsec/coreruleset/rules/*.conf
EOF

# Configure nginx directories and permissions for node user
RUN mkdir -p /var/log/nginx /etc/nginx/ssl /var/www/html/.well-known/acme-challenge /etc/nginx/snippets /etc/nginx/conf.d /etc/nginx/sites-available /etc/nginx/sites-enabled /run/nginx \
    && chmod -R 777 /var/log/nginx /etc/nginx/ssl /var/www/html/.well-known /etc/nginx/snippets /etc/nginx/conf.d /etc/nginx/sites-available /etc/nginx/sites-enabled /run/nginx /var/log/modsec /etc/nginx/modsec \
    && chown -R node:node /var/log/nginx /etc/nginx/ssl /var/www/html /etc/nginx/snippets /etc/nginx/conf.d /etc/nginx/sites-available /etc/nginx/sites-enabled /run/nginx /var/log/modsec

# Create nginx configuration with ModSecurity enabled
RUN cat > /etc/nginx/nginx.conf <<'EOF'
user node;
worker_processes auto;
pid /run/nginx.pid;

# Load ModSecurity dynamic module
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

# Fix permissions for node user
RUN chown -R node:node /etc/nginx /var/log/nginx /var/www/html \
    && chmod -R 777 /var/log/nginx /var/www/html

# Configure sudo for node user
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install Oh My Zsh for node user
USER node
RUN sh -c "$(wget -O- https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Switch back to root to configure zsh as default shell
USER root
RUN chsh -s /usr/bin/zsh node

# Set up node user and workspace
USER node
WORKDIR /workspace

# Configure git safe directory
RUN git config --global --add safe.directory /workspace

# Set default shell to zsh
ENV SHELL=/usr/bin/zsh

CMD ["/usr/bin/zsh"]
