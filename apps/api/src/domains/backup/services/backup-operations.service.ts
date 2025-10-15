import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../../../utils/logger';
import {
  BACKUP_CONSTANTS,
  DomainBackupData,
  SSLBackupData,
  SSLCertificateFiles,
} from '../backup.types';

const execAsync = promisify(exec);

/**
 * Backup Operations Service
 * Handles file system operations for backups (vhost configs, SSL certs, etc.)
 */
export class BackupOperationsService {
  /**
   * Ensure backup directory exists
   */
  async ensureBackupDir(): Promise<void> {
    try {
      await fs.mkdir(BACKUP_CONSTANTS.BACKUP_DIR, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
      throw new Error('Failed to create backup directory');
    }
  }

  /**
   * Reload nginx configuration
   */
  async reloadNginx(): Promise<boolean> {
    try {
      // Test nginx configuration first
      logger.info('Testing nginx configuration...');
      await execAsync('nginx -t');

      // Reload nginx
      logger.info('Reloading nginx...');
      await execAsync('nginx -s reload');

      logger.info('Nginx reloaded successfully');
      return true;
    } catch (error: any) {
      logger.error('Failed to reload nginx:', error);
      logger.error('Nginx test/reload output:', error.stdout || error.stderr);

      // Try alternative reload methods
      try {
        logger.info('Trying alternative reload method...');
        await execAsync('nginx -s reload');
        logger.info('Nginx reloaded successfully (alternative method)');
        return true;
      } catch (altError) {
        logger.error('Alternative reload also failed:', altError);
        return false;
      }
    }
  }

  /**
   * Format bytes to human readable size
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Write backup file to disk
   */
  async writeBackupFile(data: any, filename: string): Promise<string> {
    const filepath = path.join(BACKUP_CONSTANTS.BACKUP_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
    return filepath;
  }

  /**
   * Read nginx vhost configuration file for a domain
   */
  async readNginxVhostConfig(domainName: string) {
    try {
      const vhostPath = path.join(
        BACKUP_CONSTANTS.NGINX_SITES_AVAILABLE,
        `${domainName}.conf`
      );
      const vhostConfig = await fs.readFile(vhostPath, 'utf-8');

      // Check if symlink exists in sites-enabled
      let isEnabled = false;
      try {
        const enabledPath = path.join(
          BACKUP_CONSTANTS.NGINX_SITES_ENABLED,
          `${domainName}.conf`
        );
        await fs.access(enabledPath);
        isEnabled = true;
      } catch {
        isEnabled = false;
      }

      return {
        domainName,
        config: vhostConfig,
        enabled: isEnabled,
      };
    } catch (error) {
      logger.warn(`Nginx vhost config not found for ${domainName}`);
      return null;
    }
  }

  /**
   * Write nginx vhost configuration file for a domain
   */
  async writeNginxVhostConfig(
    domainName: string,
    config: string,
    enabled: boolean = true
  ) {
    try {
      await fs.mkdir(BACKUP_CONSTANTS.NGINX_SITES_AVAILABLE, {
        recursive: true,
      });
      await fs.mkdir(BACKUP_CONSTANTS.NGINX_SITES_ENABLED, { recursive: true });

      const vhostPath = path.join(
        BACKUP_CONSTANTS.NGINX_SITES_AVAILABLE,
        `${domainName}.conf`
      );
      await fs.writeFile(vhostPath, config, 'utf-8');
      logger.info(`Nginx vhost config written for ${domainName}`);

      // Create symlink in sites-enabled if enabled
      if (enabled) {
        const enabledPath = path.join(
          BACKUP_CONSTANTS.NGINX_SITES_ENABLED,
          `${domainName}.conf`
        );
        try {
          await fs.unlink(enabledPath);
        } catch {
          // Ignore if doesn't exist
        }
        await fs.symlink(vhostPath, enabledPath);
        logger.info(`Nginx vhost enabled for ${domainName}`);
      }
    } catch (error) {
      logger.error(`Error writing nginx vhost config for ${domainName}:`, error);
      throw error;
    }
  }

  /**
   * Read SSL certificate files for a domain
   */
  async readSSLCertificateFiles(
    domainName: string
  ): Promise<SSLCertificateFiles> {
    try {
      const certPath = path.join(
        BACKUP_CONSTANTS.SSL_CERTS_PATH,
        `${domainName}.crt`
      );
      const keyPath = path.join(
        BACKUP_CONSTANTS.SSL_CERTS_PATH,
        `${domainName}.key`
      );
      const chainPath = path.join(
        BACKUP_CONSTANTS.SSL_CERTS_PATH,
        `${domainName}.chain.crt`
      );

      const sslFiles: SSLCertificateFiles = {};

      // Try to read certificate file
      try {
        sslFiles.certificate = await fs.readFile(certPath, 'utf-8');
      } catch (error) {
        logger.warn(`SSL certificate not found for ${domainName}: ${certPath}`);
      }

      // Try to read private key file
      try {
        sslFiles.privateKey = await fs.readFile(keyPath, 'utf-8');
      } catch (error) {
        logger.warn(`SSL private key not found for ${domainName}: ${keyPath}`);
      }

      // Try to read chain file (optional)
      try {
        sslFiles.chain = await fs.readFile(chainPath, 'utf-8');
      } catch (error) {
        // Chain is optional, don't log warning
      }

      return sslFiles;
    } catch (error) {
      logger.error(`Error reading SSL files for ${domainName}:`, error);
      return {};
    }
  }

  /**
   * Write SSL certificate files for a domain
   */
  async writeSSLCertificateFiles(
    domainName: string,
    sslFiles: SSLCertificateFiles
  ) {
    try {
      await fs.mkdir(BACKUP_CONSTANTS.SSL_CERTS_PATH, { recursive: true });

      if (sslFiles.certificate) {
        const certPath = path.join(
          BACKUP_CONSTANTS.SSL_CERTS_PATH,
          `${domainName}.crt`
        );
        await fs.writeFile(certPath, sslFiles.certificate, 'utf-8');
        logger.info(`SSL certificate written for ${domainName}`);
      }

      if (sslFiles.privateKey) {
        const keyPath = path.join(
          BACKUP_CONSTANTS.SSL_CERTS_PATH,
          `${domainName}.key`
        );
        await fs.writeFile(keyPath, sslFiles.privateKey, 'utf-8');
        // Set proper permissions for private key
        await fs.chmod(keyPath, 0o600);
        logger.info(`SSL private key written for ${domainName}`);
      }

      if (sslFiles.chain) {
        const chainPath = path.join(
          BACKUP_CONSTANTS.SSL_CERTS_PATH,
          `${domainName}.chain.crt`
        );
        await fs.writeFile(chainPath, sslFiles.chain, 'utf-8');
        logger.info(`SSL chain written for ${domainName}`);
      }
    } catch (error) {
      logger.error(`Error writing SSL files for ${domainName}:`, error);
      throw error;
    }
  }

  /**
   * Generate nginx vhost configuration for a domain during backup restore
   */
  async generateNginxConfigForBackup(domain: any): Promise<void> {
    const configPath = path.join(
      BACKUP_CONSTANTS.NGINX_SITES_AVAILABLE,
      `${domain.name}.conf`
    );
    const enabledPath = path.join(
      BACKUP_CONSTANTS.NGINX_SITES_ENABLED,
      `${domain.name}.conf`
    );

    // Determine if any upstream uses HTTPS
    const hasHttpsUpstream =
      domain.upstreams?.some((u: any) => u.protocol === 'https') || false;
    const upstreamProtocol = hasHttpsUpstream ? 'https' : 'http';

    // Calculate keepalive connections: 10 connections per backend
    const backendCount = domain.upstreams?.length || 0;
    const keepaliveConnections = backendCount * 10;

    // Generate WebSocket map block
    const websocketMapBlock = `
# WebSocket support - Map for connection upgrade
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

`;

    // Generate upstream block
    const upstreamBlock = `
upstream ${domain.name.replace(/\./g, '_')}_backend {
    ${domain.loadBalancer?.algorithm === 'least_conn' ? 'least_conn;' : ''}
    ${domain.loadBalancer?.algorithm === 'ip_hash' ? 'ip_hash;' : ''}

    ${(domain.upstreams || [])
      .map(
        (u: any) =>
          `server ${u.host}:${u.port} weight=${u.weight || 1} max_fails=${u.maxFails || 3} fail_timeout=${u.failTimeout || 10}s;`
      )
      .join('\n    ')}
    
    # Keepalive connections - 10 per backend (${backendCount} backends)
    keepalive ${keepaliveConnections};
}
`;

    // HTTP server block (always present)
    let httpServerBlock = `
server {
    listen 80;
    server_name ${domain.name};

    # Include ACL rules (IP whitelist/blacklist)
    include /etc/nginx/conf.d/acl-rules.conf;

    # Include ACME challenge location for Let's Encrypt
    include /etc/nginx/snippets/acme-challenge.conf;

    ${
      domain.sslEnabled
        ? `
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
    `
        : `
    ${domain.modsecEnabled ? 'modsecurity on;' : 'modsecurity off;'}

    access_log /var/log/nginx/${domain.name}_access.log main;
    error_log /var/log/nginx/${domain.name}_error.log warn;

    location / {
        proxy_pass ${upstreamProtocol}://${domain.name.replace(/\./g, '_')}_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        
        # WebSocket timeout settings
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;

        ${
          hasHttpsUpstream
            ? `
        # HTTPS Backend Settings
        ${
          domain.upstreams?.some(
            (u: any) => u.protocol === 'https' && !u.sslVerify
          )
            ? 'proxy_ssl_verify off;'
            : 'proxy_ssl_verify on;'
        }
        proxy_ssl_server_name on;
        proxy_ssl_name ${domain.name};
        proxy_ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
        `
            : ''
        }

        ${
          domain.loadBalancer?.healthCheckEnabled
            ? `
        # Health check settings
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout ${domain.loadBalancer.healthCheckTimeout || 5}s;
        `
            : ''
        }
    }

    location /nginx_health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
    `
    }
}
`;

    // HTTPS server block (only if SSL enabled)
    let httpsServerBlock = '';
    if (domain.sslEnabled && domain.sslCertificate) {
      httpsServerBlock = `
server {
    listen 443 ssl http2;
    server_name ${domain.name};

    # Include ACL rules (IP whitelist/blacklist)
    include /etc/nginx/conf.d/acl-rules.conf;

    # SSL Certificate Configuration
    ssl_certificate /etc/nginx/ssl/${domain.name}.crt;
    ssl_certificate_key /etc/nginx/ssl/${domain.name}.key;
    ${
      domain.sslCertificate.chain
        ? `ssl_trusted_certificate /etc/nginx/ssl/${domain.name}.chain.crt;`
        : ''
    }

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    ${domain.modsecEnabled ? 'modsecurity on;' : 'modsecurity off;'}

    access_log /var/log/nginx/${domain.name}_ssl_access.log main;
    error_log /var/log/nginx/${domain.name}_ssl_error.log warn;

    location / {
        proxy_pass ${upstreamProtocol}://${domain.name.replace(/\./g, '_')}_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        
        # WebSocket timeout settings
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;

        ${
          hasHttpsUpstream
            ? `
        # HTTPS Backend Settings
        ${
          domain.upstreams?.some(
            (u: any) => u.protocol === 'https' && !u.sslVerify
          )
            ? 'proxy_ssl_verify off;'
            : 'proxy_ssl_verify on;'
        }
        proxy_ssl_server_name on;
        proxy_ssl_name ${domain.name};
        proxy_ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
        `
            : ''
        }

        ${
          domain.loadBalancer?.healthCheckEnabled
            ? `
        # Health check settings
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout ${domain.loadBalancer.healthCheckTimeout || 5}s;
        `
            : ''
        }
    }

    location /nginx_health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
`;
    }

    const fullConfig = websocketMapBlock + upstreamBlock + httpServerBlock + httpsServerBlock;

    // Write configuration file
    try {
      await fs.mkdir(BACKUP_CONSTANTS.NGINX_SITES_AVAILABLE, {
        recursive: true,
      });
      await fs.mkdir(BACKUP_CONSTANTS.NGINX_SITES_ENABLED, { recursive: true });
      await fs.writeFile(configPath, fullConfig);

      // Create symlink if domain is active
      if (domain.status === 'active') {
        try {
          await fs.unlink(enabledPath);
        } catch (e) {
          // File doesn't exist, ignore
        }
        await fs.symlink(configPath, enabledPath);
      }

      logger.info(
        `Nginx configuration generated for ${domain.name} during backup restore`
      );
    } catch (error) {
      logger.error(`Failed to write nginx config for ${domain.name}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const backupOperationsService = new BackupOperationsService();
