# Configuration

This section covers the configuration options available in nginx-love.

## Environment Variables

nginx-love can be configured using environment variables. These can be set in a `.env` file or directly in the environment.

### Database Configuration

```bash
# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nginx_love
DB_USER=nginx_love
DB_PASSWORD=password

# Database SSL (optional)
DB_SSL=false
DB_SSL_CERT=/path/to/cert.pem
DB_SSL_KEY=/path/to/key.pem
DB_SSL_CA=/path/to/ca.pem
```

### Application Configuration

```bash
# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# JWT Secret
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your-encryption-key
```

### Nginx Configuration

```bash
# Nginx
NGINX_CONFIG_PATH=/etc/nginx/nginx.conf
NGINX_SITES_PATH=/etc/nginx/sites-available
NGINX_LOG_PATH=/var/log/nginx

# Nginx reload command
NGINX_RELOAD_COMMAND=systemctl reload nginx
```

### Let's Encrypt Configuration

```bash
# Let's Encrypt
LETSENCRYPT_EMAIL=admin@example.com
LETSENCRYPT_STAGING=false
LETSENCRYPT_RENEWAL_THRESHOLD=30
```

### Email Configuration

```bash
# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@example.com
SMTP_PASSWORD=password
SMTP_FROM=noreply@example.com
```

### Monitoring Configuration

```bash
# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090
LOG_LEVEL=info
```

## Configuration File

nginx-love can also be configured using a configuration file. By default, it looks for `config/config.json` in the application directory.

```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "nginx_love",
    "user": "nginx_love",
    "password": "password",
    "ssl": false
  },
  "application": {
    "port": 3000,
    "host": "0.0.0.0",
    "jwtSecret": "your-secret-key",
    "jwtExpiresIn": "7d",
    "encryptionKey": "your-encryption-key"
  },
  "nginx": {
    "configPath": "/etc/nginx/nginx.conf",
    "sitesPath": "/etc/nginx/sites-available",
    "logPath": "/var/log/nginx",
    "reloadCommand": "systemctl reload nginx"
  },
  "letsencrypt": {
    "email": "admin@example.com",
    "staging": false,
    "renewalThreshold": 30
  },
  "email": {
    "smtp": {
      "host": "smtp.example.com",
      "port": 587,
      "secure": false,
      "user": "noreply@example.com",
      "password": "password",
      "from": "noreply@example.com"
    }
  },
  "monitoring": {
    "metricsEnabled": true,
    "metricsPort": 9090,
    "logLevel": "info"
  }
}
```

## Nginx Configuration Templates

nginx-love uses templates to generate Nginx configuration files. These templates can be customized to meet your specific needs.

### Basic Domain Template

```nginx
server {
    listen 80;
    server_name {{domain.name}} {{domain.serverAlias}};

    root {{domain.documentRoot}};
    index index.html index.php;

    access_log {{domain.accessLog}};
    error_log {{domain.errorLog}};

    location / {
        try_files $uri $uri/ =404;
    }

    {{#domain.sslEnabled}}
    listen 443 ssl;
    ssl_certificate {{domain.sslCertificate}};
    ssl_certificate_key {{domain.sslPrivateKey}};
    {{/domain.sslEnabled}}

    {{#domain.modSecurityEnabled}}
    ModSecurityEnabled on;
    ModSecurityConfig /etc/nginx/modsec/main.conf;
    {{/domain.modSecurityEnabled}}
}
```

### PHP-FPM Template

```nginx
server {
    listen 80;
    server_name {{domain.name}} {{domain.serverAlias}};

    root {{domain.documentRoot}};
    index index.php index.html;

    access_log {{domain.accessLog}};
    error_log {{domain.errorLog}};

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    {{#domain.sslEnabled}}
    listen 443 ssl;
    ssl_certificate {{domain.sslCertificate}};
    ssl_certificate_key {{domain.sslPrivateKey}};
    {{/domain.sslEnabled}}
}
```

### Reverse Proxy Template

```nginx
server {
    listen 80;
    server_name {{domain.name}} {{domain.serverAlias}};

    access_log {{domain.accessLog}};
    error_log {{domain.errorLog}};

    location / {
        proxy_pass {{domain.proxyUrl}};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    {{#domain.sslEnabled}}
    listen 443 ssl;
    ssl_certificate {{domain.sslCertificate}};
    ssl_certificate_key {{domain.sslPrivateKey}};
    {{/domain.sslEnabled}}
}
```

## ModSecurity Configuration

nginx-love provides default ModSecurity configuration that can be customized.

### Main Configuration

```nginx
SecRuleEngine On
SecRequestBodyAccess On
SecResponseBodyAccess On
SecRequestBodyLimit 13107200
SecRequestBodyNoFilesLimit 131072
SecRequestBodyInMemoryLimit 131072
SecResponseBodyLimit 524288
SecResponseBodyMimeType text/plain text/html text/xml application/json
```

### OWASP CRS Configuration

```nginx
Include /etc/nginx/modsec/crs-setup.conf
Include /etc/nginx/modsec/rules/*.conf
```

## SSL Configuration

nginx-love provides default SSL configuration that can be customized.

### SSL Configuration

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### HSTS Configuration

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;