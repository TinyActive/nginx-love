import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../../../utils/logger';
import { PATHS } from '../../../shared/constants/paths.constants';
import { DomainWithRelations } from '../domains.types';
import { cloudflareIpsService } from './cloudflare-ips.service';

/**
 * Service for generating Nginx configuration files
 */
export class NginxConfigService {
  private readonly sitesAvailable = PATHS.NGINX.SITES_AVAILABLE;
  private readonly sitesEnabled = PATHS.NGINX.SITES_ENABLED;

  /**
   * Generate complete Nginx configuration for a domain
   */
  async generateConfig(domain: DomainWithRelations): Promise<void> {
    const configPath = path.join(this.sitesAvailable, `${domain.name}.conf`);
    const enabledPath = path.join(this.sitesEnabled, `${domain.name}.conf`);

    // Debug logging
    logger.info(`Generating nginx config for ${domain.name}:`);
    logger.info(`- SSL Enabled: ${domain.sslEnabled}`);
    logger.info(`- Has SSL Certificate: ${!!domain.sslCertificate}`);
    if (domain.sslCertificate) {
      logger.info(`- Certificate ID: ${domain.sslCertificate.id}`);
    }

    // Generate configuration blocks
    const upstreamBlock = this.generateUpstreamBlock(domain);
    const httpServerBlock = await this.generateHttpServerBlock(domain);
    const httpsServerBlock = await this.generateHttpsServerBlock(domain);

    const fullConfig = upstreamBlock + httpServerBlock + httpsServerBlock;

    // Write configuration file
    try {
      await fs.mkdir(this.sitesAvailable, { recursive: true });
      await fs.mkdir(this.sitesEnabled, { recursive: true });
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

      logger.info(`Nginx configuration generated for ${domain.name}`);
    } catch (error) {
      logger.error(`Failed to write nginx config for ${domain.name}:`, error);
      throw error;
    }
  }

  /**
   * Generate upstream block for load balancing
   */
  private generateUpstreamBlock(domain: DomainWithRelations): string {
    const upstreamName = domain.name.replace(/\./g, '_');
    const algorithm = domain.loadBalancer?.algorithm || 'round_robin';

    const algorithmDirectives = [];
    if (algorithm === 'least_conn') {
      algorithmDirectives.push('least_conn;');
    } else if (algorithm === 'ip_hash') {
      algorithmDirectives.push('ip_hash;');
    }

    const servers = domain.upstreams.map((u) =>
      `server ${u.host}:${u.port} weight=${u.weight} max_fails=${u.maxFails} fail_timeout=${u.failTimeout}s;`
    ).join('\n    ');

    // Calculate keepalive connections: 10 connections per backend
    const keepaliveConnections = domain.upstreams.length * 10;

    return `
upstream ${upstreamName}_backend {
    ${algorithmDirectives.join('\n    ')}
    ${algorithmDirectives.length > 0 ? '\n    ' : ''}${servers}
    
    # Keepalive connections - 10 per backend (${domain.upstreams.length} backends)
    keepalive ${keepaliveConnections};
}
`;
  }

  /**
   * Generate HTTP server block (always present)
   */
  private async generateHttpServerBlock(domain: DomainWithRelations): Promise<string> {
    const upstreamName = domain.name.replace(/\./g, '_');
    const hasHttpsUpstream = domain.upstreams.some((u) => u.protocol === 'https');
    const upstreamProtocol = hasHttpsUpstream ? 'https' : 'http';

    // Generate Real IP block
    const realIpBlock = await this.generateRealIpBlock(domain);

    // If SSL is enabled, HTTP server just redirects to HTTPS
    if (domain.sslEnabled) {
      return `
server {
    listen 80;
    server_name ${domain.name};

${realIpBlock}
    # Include ACL rules (IP whitelist/blacklist)
    include /etc/nginx/conf.d/acl-rules.conf;

    # Include ACME challenge location for Let's Encrypt
    include /etc/nginx/snippets/acme-challenge.conf;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}
`;
    }

    // HTTP server with full proxy configuration
    return `
server {
    listen 80;
    server_name ${domain.name};

${realIpBlock}
    # Include ACL rules (IP whitelist/blacklist)
    include /etc/nginx/conf.d/acl-rules.conf;

    # Include ACME challenge location for Let's Encrypt
    include /etc/nginx/snippets/acme-challenge.conf;

    ${domain.modsecEnabled ? 'modsecurity on;' : 'modsecurity off;'}

    access_log /var/log/nginx/${domain.name}_access.log main;
    error_log /var/log/nginx/${domain.name}_error.log warn;

    location / {
        ${this.generateProxyHeaders(domain)}
        proxy_pass ${upstreamProtocol}://${upstreamName}_backend;

        ${this.generateHttpsBackendSettings(domain)}

        ${this.generateHealthCheckSettings(domain)}
    }

    location /nginx_health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
`;
  }

  /**
   * Generate HTTPS server block (only if SSL enabled)
   */
  private async generateHttpsServerBlock(domain: DomainWithRelations): Promise<string> {
    if (!domain.sslEnabled || !domain.sslCertificate) {
      return '';
    }

    const upstreamName = domain.name.replace(/\./g, '_');
    const hasHttpsUpstream = domain.upstreams.some((u) => u.protocol === 'https');
    const upstreamProtocol = hasHttpsUpstream ? 'https' : 'http';

    // Generate Real IP block
    const realIpBlock = await this.generateRealIpBlock(domain);

    return `
server {
    listen 443 ssl http2;
    server_name ${domain.name};

${realIpBlock}
    # Include ACL rules (IP whitelist/blacklist)
    include /etc/nginx/conf.d/acl-rules.conf;

    # SSL Certificate Configuration
    ssl_certificate /etc/nginx/ssl/${domain.name}.crt;
    ssl_certificate_key /etc/nginx/ssl/${domain.name}.key;
    ${domain.sslCertificate.chain ? `ssl_trusted_certificate /etc/nginx/ssl/${domain.name}.chain.crt;` : ''}

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
        ${this.generateProxyHeaders(domain)}
        proxy_pass ${upstreamProtocol}://${upstreamName}_backend;

        ${this.generateHttpsBackendSettings(domain)}

        ${this.generateHealthCheckSettings(domain)}
    }

    location /nginx_health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
`;
  }

  /**
   * Generate Real IP configuration block
   * Supports Cloudflare IP ranges (auto-fetched) and custom CIDRs
   */
  private async generateRealIpBlock(domain: DomainWithRelations): Promise<string> {
    if (!domain.realIpEnabled) {
      return '';
    }

    const lines: string[] = [];
    lines.push('    # Real IP Configuration');

    // Cloudflare IP ranges (fetched from Cloudflare or fallback)
    if (domain.realIpCloudflare) {
      try {
        const cloudflareIPs = await cloudflareIpsService.getCloudflareIPs();
        cloudflareIPs.forEach(ip => {
          lines.push(`    set_real_ip_from ${ip};`);
        });
      } catch (error) {
        logger.error('Failed to get Cloudflare IPs, skipping Real IP config', error);
        logger.error('Failed to fetch Cloudflare IPs for Real IP configuration, disabling Real IP for this domain', error);
        return '';
      }
    }

    // Custom CIDR ranges
    if (domain.realIpCustomCidrs && domain.realIpCustomCidrs.length > 0) {
      domain.realIpCustomCidrs.forEach(cidr => {
        lines.push(`    set_real_ip_from ${cidr};`);
      });
    }

    // Set the header to use for real IP
    lines.push('    real_ip_header X-Forwarded-For;');
    lines.push('    real_ip_recursive on;');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate proxy headers for passing client information to backend
   */
  private generateProxyHeaders(domain: DomainWithRelations): string {
    return `proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;`;
  }

  /**
   * Generate HTTPS backend settings if upstream uses HTTPS
   */
  private generateHttpsBackendSettings(domain: DomainWithRelations): string {
    const hasHttpsUpstream = domain.upstreams.some((u) => u.protocol === 'https');

    if (!hasHttpsUpstream) {
      return '';
    }

    const shouldVerify = domain.upstreams.some(
      (u) => u.protocol === 'https' && u.sslVerify
    );

    return `
        # HTTPS Backend Settings
        ${shouldVerify ? 'proxy_ssl_verify on;' : 'proxy_ssl_verify off;'}
        proxy_ssl_server_name on;
        proxy_ssl_name ${domain.name};
        proxy_ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
        `;
  }

  /**
   * Generate health check settings
   */
  private generateHealthCheckSettings(domain: DomainWithRelations): string {
    if (!domain.loadBalancer?.healthCheckEnabled) {
      return '';
    }

    return `
        # Health check settings
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout ${domain.loadBalancer.healthCheckTimeout}s;
        `;
  }

  /**
   * Delete nginx configuration for a domain
   */
  async deleteConfig(domainName: string): Promise<void> {
    const configPath = path.join(this.sitesAvailable, `${domainName}.conf`);
    const enabledPath = path.join(this.sitesEnabled, `${domainName}.conf`);

    try {
      await fs.unlink(enabledPath).catch(() => {});
      await fs.unlink(configPath).catch(() => {});
      logger.info(`Nginx configuration deleted for ${domainName}`);
    } catch (error) {
      logger.error(`Failed to delete nginx config for ${domainName}:`, error);
    }
  }

  /**
   * Enable configuration by creating symlink
   */
  async enableConfig(domainName: string): Promise<void> {
    const configPath = path.join(this.sitesAvailable, `${domainName}.conf`);
    const enabledPath = path.join(this.sitesEnabled, `${domainName}.conf`);

    try {
      await fs.unlink(enabledPath).catch(() => {});
      await fs.symlink(configPath, enabledPath);
      logger.info(`Nginx configuration enabled for ${domainName}`);
    } catch (error) {
      logger.error(`Failed to enable config for ${domainName}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const nginxConfigService = new NginxConfigService();