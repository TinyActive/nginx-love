import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../../../utils/logger';
import { PATHS } from '../../../shared/constants/paths.constants';
import { DomainWithRelations } from '../domains.types';
import { cloudflareIpsService } from './cloudflare-ips.service';
import { DEFAULT_CLIENT_MAX_BODY_SIZE } from '../../../shared/constants/domain.constants';

const execAsync = promisify(exec);

/**
 * Service for generating Nginx configuration files
 */
export class NginxConfigService {
  private readonly sitesAvailable = PATHS.NGINX.SITES_AVAILABLE;
  private readonly sitesEnabled = PATHS.NGINX.SITES_ENABLED;

  /**
   * Validate nginx configuration syntax
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async validateNginxConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      const { stdout, stderr } = await execAsync('nginx -t 2>&1');
      const output = stdout + stderr;
      
      if (output.includes('syntax is ok') && output.includes('test is successful')) {
        logger.info('Nginx configuration validation passed');
        return { valid: true };
      }
      
      logger.error('Nginx configuration validation failed:', output);
      return { valid: false, error: output };
    } catch (error: any) {
      logger.error('Nginx configuration validation error:', error.message);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Generate complete Nginx configuration for a domain
   */
  async generateConfig(domain: DomainWithRelations): Promise<void> {
    const configPath = path.join(this.sitesAvailable, `${domain.name}.conf`);
    const enabledPath = path.join(this.sitesEnabled, `${domain.name}.conf`);
    const backupPath = path.join(this.sitesAvailable, `${domain.name}.conf.backup`);

    // Debug logging
    logger.info(`Generating nginx config for ${domain.name}:`);
    logger.info(`- SSL Enabled: ${domain.sslEnabled}`);
    logger.info(`- Has SSL Certificate: ${!!domain.sslCertificate}`);
    if (domain.sslCertificate) {
      logger.info(`- Certificate ID: ${domain.sslCertificate.id}`);
    }

    // Generate configuration blocks
    const websocketMapBlock = this.generateWebSocketMapBlock();
    const upstreamBlock = this.generateUpstreamBlock(domain);
    const httpServerBlock = await this.generateHttpServerBlock(domain);
    const httpsServerBlock = await this.generateHttpsServerBlock(domain);

    const fullConfig = websocketMapBlock + upstreamBlock + httpServerBlock + httpsServerBlock;

    // Write configuration file
    try {
      await fs.mkdir(this.sitesAvailable, { recursive: true });
      await fs.mkdir(this.sitesEnabled, { recursive: true });

      // Backup existing config if it exists
      try {
        await fs.copyFile(configPath, backupPath);
        logger.info(`Backed up existing config to ${backupPath}`);
      } catch (e) {
        // No existing config to backup
      }

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

      // Validate nginx configuration
      const validation = await this.validateNginxConfig();
      
      if (!validation.valid) {
        // Restore backup if validation fails
        logger.error(`Nginx config validation failed for ${domain.name}, restoring backup`);
        try {
          await fs.copyFile(backupPath, configPath);
          logger.info('Backup restored successfully');
        } catch (restoreError) {
          logger.error('Failed to restore backup:', restoreError);
        }
        
        throw new Error(`Invalid nginx configuration: ${validation.error}`);
      }

      logger.info(`Nginx configuration generated and validated for ${domain.name}`);
      
      // Clean up backup after successful validation
      try {
        await fs.unlink(backupPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    } catch (error) {
      logger.error(`Failed to generate nginx config for ${domain.name}:`, error);
      throw error;
    }
  }

  /**
   * Get client max body size for a domain
   * Returns the configured value or default if not set
   */
  private getClientMaxBodySize(domain: DomainWithRelations): number {
    return domain.clientMaxBodySize || DEFAULT_CLIENT_MAX_BODY_SIZE;
  }

  /**
   * Generate WebSocket map block for connection upgrade
   * This enables WebSocket support for all domains by default
   */
  private generateWebSocketMapBlock(): string {
    return `
# WebSocket support - Map for connection upgrade
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

`;
  }

  /**
   * Generate upstream block for load balancing
   */
  private generateUpstreamBlock(domain: DomainWithRelations): string {
    const upstreamName = domain.name.replace(/\./g, '_');
    const algorithm = domain.loadBalancer?.algorithm || 'round_robin';

    const algorithmDirectives: string[] = [];
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

    let upstreamBlocks = `
upstream ${upstreamName}_backend {
    ${algorithmDirectives.join('\n    ')}
    ${algorithmDirectives.length > 0 ? '\n    ' : ''}${servers}
    
    # Keepalive connections - 10 per backend (${domain.upstreams.length} backends)
    keepalive ${keepaliveConnections};
}
`;

    // Generate upstream blocks for custom locations
    if (domain.customLocations && typeof domain.customLocations === 'object') {
      try {
        const locations = Array.isArray(domain.customLocations) 
          ? domain.customLocations 
          : (domain.customLocations as any).locations || [];

        locations.forEach((loc: any) => {
          // Skip if config already contains proxy_pass or grpc_pass (user manages their own upstream)
          const hasProxyDirective = loc.config && (
            loc.config.includes('proxy_pass') || 
            loc.config.includes('grpc_pass')
          );
          
          if (hasProxyDirective) {
            return; // Skip upstream generation
          }

          // Only generate upstream if we have valid upstreams with non-empty hosts
          if (loc.upstreams && Array.isArray(loc.upstreams) && loc.upstreams.length > 0) {
            const validUpstreams = loc.upstreams.filter((u: any) => u.host && u.host.trim() !== '');
            
            if (validUpstreams.length === 0) {
              return; // Skip if no valid upstreams
            }

            const locationUpstreamName = `${domain.name.replace(/\./g, '_')}_${loc.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const locationServers = validUpstreams.map((u: any) =>
              `server ${u.host}:${u.port} weight=${u.weight || 1} max_fails=${u.maxFails || 3} fail_timeout=${u.failTimeout || 10}s;`
            ).join('\n    ');

            upstreamBlocks += `
upstream ${locationUpstreamName}_backend {
    ${algorithmDirectives.join('\n    ')}
    ${algorithmDirectives.length > 0 ? '\n    ' : ''}${locationServers}
    
    keepalive ${validUpstreams.length * 10};
}
`;
          }
        });
      } catch (error) {
        logger.error('Failed to generate custom location upstreams:', error);
      }
    }

    return upstreamBlocks;
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

    # Include ACME challenge location for ZeroSSL/Let's Encrypt
    include /etc/nginx/snippets/acme-challenge.conf;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}
`;
    }

    // Generate Access Lists block
    const accessListsBlock = this.generateAccessListsBlock(domain);

    // Client max body size
    const clientMaxBodySize = this.getClientMaxBodySize(domain);

    // HTTP server with full proxy configuration
    return `
server {
    listen 80;
    server_name ${domain.name};

${realIpBlock}
${accessListsBlock}
    # Include ACL rules (IP whitelist/blacklist)
    include /etc/nginx/conf.d/acl-rules.conf;

    # Include ACME challenge location for ZeroSSL/Let's Encrypt
    include /etc/nginx/snippets/acme-challenge.conf;

    # Maximum request body size
    client_max_body_size ${clientMaxBodySize}M;

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
    
    // Generate HSTS header if enabled
    const hstsHeader = domain.hstsEnabled 
      ? 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;'
      : 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;';
    
    // HTTP/2 support (enabled by default, can be disabled)
    const http2Support = domain.http2Enabled !== false ? ' http2' : '';
    
    // Generate custom locations if configured
    const customLocations = this.generateCustomLocations(domain);
    
    // Generate Access Lists block
    const accessListsBlock = this.generateAccessListsBlock(domain);

    // Client max body size
    const clientMaxBodySize = this.getClientMaxBodySize(domain);

    return `
server {
    listen 443 ssl${http2Support};
    server_name ${domain.name};

${realIpBlock}
${accessListsBlock}
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
    ${hstsHeader}
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Maximum request body size
    client_max_body_size ${clientMaxBodySize}M;

    ${domain.modsecEnabled ? 'modsecurity on;' : 'modsecurity off;'}

    access_log /var/log/nginx/${domain.name}_ssl_access.log main;
    error_log /var/log/nginx/${domain.name}_ssl_error.log warn;

${customLocations}
    location / {
        ${domain.grpcEnabled ? this.generateGrpcLocationBlock(domain, upstreamName) : this.generateProxyLocationBlock(domain, upstreamName, upstreamProtocol)}
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
   * Generate Access Lists includes for a domain
   */
  private generateAccessListsBlock(domain: DomainWithRelations): string {
    // Check if domain has access lists
    if (!domain.accessLists || domain.accessLists.length === 0) {
      return '';
    }

    const lines: string[] = [];
    lines.push('    # Access Lists Configuration');

    // Include each enabled access list
    domain.accessLists
      .filter(al => al.enabled && al.accessList.enabled)
      .forEach(al => {
        const configFile = `/etc/nginx/access-lists/${al.accessList.name}.conf`;
        lines.push(`    include ${configFile};`);
      });

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Generate proxy headers for passing client information to backend
   * Includes WebSocket support by default
   */
  private generateProxyHeaders(domain: DomainWithRelations): string {
    return `proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        
        # WebSocket timeout settings
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;`;
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
   * Generate health check settings for HTTP/HTTPS proxy
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
   * Generate health check settings for gRPC
   */
  private generateGrpcHealthCheckSettings(domain: DomainWithRelations): string {
    if (!domain.loadBalancer?.healthCheckEnabled) {
      return '';
    }

    return `
        # gRPC Health check settings
        grpc_next_upstream error timeout http_502 http_503 http_504;
        grpc_next_upstream_tries 3;
        grpc_next_upstream_timeout ${domain.loadBalancer.healthCheckTimeout}s;
        `;
  }

  /**
   * Generate proxy_pass directive
   */
  private generateProxyPass(domain: DomainWithRelations, upstreamName: string, protocol: string): string {
    return `proxy_pass ${protocol}://${upstreamName}_backend;`;
  }

  /**
   * Generate grpc_pass directive with proper scheme
   * Note: Only grpc_pass directive exists. Use grpc:// or grpcs:// scheme for protocol
   */
  private generateGrpcPass(domain: DomainWithRelations, upstreamName: string): string {
    const hasHttpsUpstream = domain.upstreams.some((u) => u.protocol === 'https');
    const grpcScheme = hasHttpsUpstream ? 'grpcs://' : 'grpc://';
    return `grpc_pass ${grpcScheme}${upstreamName}_backend;`;
  }

  /**
   * Generate complete gRPC location block with SSL settings
   */
  private generateGrpcLocationBlock(domain: DomainWithRelations, upstreamName: string): string {
    const hasHttpsUpstream = domain.upstreams.some((u) => u.protocol === 'https');
    const grpcScheme = hasHttpsUpstream ? 'grpcs://' : 'grpc://';
    
    const shouldVerify = domain.upstreams.some(
      (u) => u.protocol === 'https' && u.sslVerify
    );

    // gRPC SSL settings (if using HTTPS/TLS backend)
    let sslSettings = '';
    if (hasHttpsUpstream) {
      sslSettings = `
        # gRPC SSL Backend Settings
        ${shouldVerify ? 'grpc_ssl_verify on;' : 'grpc_ssl_verify off;'}
        grpc_ssl_server_name on;
        grpc_ssl_name ${domain.name};
        grpc_ssl_protocols TLSv1.2 TLSv1.3;`;
    }

    // gRPC timeout and error handling (equivalent to proxy_next_upstream)
    // Note: grpc_next_upstream valid values: error, timeout, invalid_header, http_500, http_502, http_503, http_504, http_403, http_404, http_429, non_idempotent, off
    let healthCheckSettings = '';
    if (domain.loadBalancer?.healthCheckEnabled) {
      healthCheckSettings = `
        # gRPC error handling and failover
        grpc_next_upstream error timeout http_502 http_503 http_504;
        grpc_next_upstream_tries 3;
        grpc_next_upstream_timeout ${domain.loadBalancer.healthCheckTimeout}s;`;
    }

    // gRPC timeouts (equivalent to proxy timeouts)
    const timeoutSettings = `
        # gRPC timeouts
        grpc_connect_timeout 60s;
        grpc_send_timeout 60s;
        grpc_read_timeout 60s;`;

    return `# gRPC Configuration
        grpc_pass ${grpcScheme}${upstreamName}_backend;
${sslSettings}
${timeoutSettings}
${healthCheckSettings}`;
  }

  /**
   * Generate complete proxy location block with SSL settings
   */
  private generateProxyLocationBlock(domain: DomainWithRelations, upstreamName: string, protocol: string): string {
    return `${this.generateProxyHeaders(domain)}
        
        # Proxy Configuration
        proxy_pass ${protocol}://${upstreamName}_backend;

        ${this.generateHttpsBackendSettings(domain)}

        ${this.generateHealthCheckSettings(domain)}`;
  }

  /**
   * Generate custom location blocks
   */
  private generateCustomLocations(domain: DomainWithRelations): string {
    if (!domain.customLocations || typeof domain.customLocations !== 'object') {
      return '';
    }

    try {
      const locations = Array.isArray(domain.customLocations) 
        ? domain.customLocations 
        : (domain.customLocations as any).locations || [];

      if (locations.length === 0) {
        return '';
      }

      return locations.map((loc: any) => {
        const { path: locPath, useUpstream, upstreamType, upstreams, config } = loc;
        
        // Case 1: User disabled upstream (useUpstream = false) - use custom config only
        if (useUpstream === false) {
          if (!config || config.trim() === '') {
            logger.warn(`Custom location ${locPath} has no config and upstream disabled, skipping`);
            return '';
          }
          
          return `
    location ${locPath} {
        ${config}
    }`;
        }

        // Case 2: User enabled upstream (useUpstream = true) - generate upstream-based config
        if (useUpstream === true) {
          // Validate that upstreams exist and have valid hosts
          if (!upstreams || !Array.isArray(upstreams) || upstreams.length === 0) {
            logger.warn(`Custom location ${locPath} has upstream enabled but no upstreams defined, skipping`);
            return '';
          }

          const validUpstreams = upstreams.filter((u: any) => u.host && u.host.trim() !== '');
          if (validUpstreams.length === 0) {
            logger.warn(`Custom location ${locPath} has no valid upstream hosts, skipping`);
            return '';
          }

          const locationUpstreamName = `${domain.name.replace(/\./g, '_')}_${locPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
          
          // Determine directive based on type
          // Important: Add trailing slash (/) to strip location path before proxying
          let proxyDirective = '';
          if (upstreamType === 'grpc_pass') {
            proxyDirective = `grpc_pass grpc://${locationUpstreamName}_backend/;`;
          } else if (upstreamType === 'grpcs_pass') {
            proxyDirective = `grpc_pass grpcs://${locationUpstreamName}_backend/;`;
          } else {
            const hasHttpsUpstream = upstreams?.some((u: any) => u.protocol === 'https');
            const protocol = hasHttpsUpstream ? 'https' : 'http';
            proxyDirective = `proxy_pass ${protocol}://${locationUpstreamName}_backend/;`;
          }

          return `
    location ${locPath} {
        ${this.generateProxyHeaders(domain)}
        ${proxyDirective}
        ${config ? '\n        ' + config : ''}
    }`;
        }

        // Case 3: Legacy - no useUpstream field (backward compatibility)
        // Check if config already contains proxy_pass or grpc_pass
        const hasProxyDirective = config && (
          config.includes('proxy_pass') || 
          config.includes('grpc_pass')
        );

        if (hasProxyDirective) {
          return `
    location ${locPath} {
        ${config}
    }`;
        }

        // Generate upstream-based config if upstreams exist
        if (upstreams && Array.isArray(upstreams) && upstreams.length > 0) {
          const validUpstreams = upstreams.filter((u: any) => u.host && u.host.trim() !== '');
          if (validUpstreams.length > 0) {
            const locationUpstreamName = `${domain.name.replace(/\./g, '_')}_${locPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
            
            // Add trailing slash (/) to strip location path before proxying
            let proxyDirective = '';
            if (upstreamType === 'grpc_pass') {
              proxyDirective = `grpc_pass grpc://${locationUpstreamName}_backend/;`;
            } else if (upstreamType === 'grpcs_pass') {
              proxyDirective = `grpc_pass grpcs://${locationUpstreamName}_backend/;`;
            } else {
              const hasHttpsUpstream = upstreams?.some((u: any) => u.protocol === 'https');
              const protocol = hasHttpsUpstream ? 'https' : 'http';
              proxyDirective = `proxy_pass ${protocol}://${locationUpstreamName}_backend/;`;
            }

            return `
    location ${locPath} {
        ${this.generateProxyHeaders(domain)}
        ${proxyDirective}
        ${config ? '\n        ' + config : ''}
    }`;
          }
        }

        // Fallback: just use config if provided
        if (config && config.trim() !== '') {
          return `
    location ${locPath} {
        ${config}
    }`;
        }

        logger.warn(`Custom location ${locPath} has no valid configuration, skipping`);
        return '';
      }).filter((loc: string) => loc !== '').join('\n');
    } catch (error) {
      logger.error('Failed to generate custom locations:', error);
      return '';
    }
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