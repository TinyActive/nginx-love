/**
 * File system paths
 */
export const PATHS = {
  NGINX: {
    SITES_AVAILABLE: '/etc/nginx/sites-available',
    SITES_ENABLED: '/etc/nginx/sites-enabled',
    SSL_DIR: process.env.SSL_DIR || '/etc/nginx/ssl',
    LOG_DIR: '/var/log/nginx',
    ACCESS_LOG: '/var/log/nginx/access.log',
    ERROR_LOG: '/var/log/nginx/error.log',
    MODSEC_AUDIT_LOG: '/var/log/modsec_audit.log',
  },
} as const;
