import { body, param, query } from 'express-validator';

/**
 * Validation rules for NLB endpoints
 */

/**
 * Validate host (IP address or hostname)
 */
function isValidHost(host: string): boolean {
  if (!host || host.trim().length === 0) {
    return false;
  }

  host = host.trim();

  // IPv4 validation - strict format
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(host)) {
    return true;
  }
  
  // IPv6 validation (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$/;
  if (ipv6Regex.test(host)) {
    return true;
  }
  
  // If it looks like an IP but failed validation, reject it
  // This catches malformed IPs like "888880.8832884"
  if (/^[\d.]+$/.test(host)) {
    return false; // Only digits and dots but not valid IP
  }
  
  // Hostname validation (RFC 1123)
  const hostnameRegex = /^(?=.{1,253}$)(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)*(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/;
  
  // Additional check: hostname labels cannot be all numeric
  if (hostnameRegex.test(host)) {
    const labels = host.split('.');
    const allNumeric = labels.every(label => /^\d+$/.test(label));
    if (allNumeric) {
      return false;
    }
    return true;
  }
  
  return false;
}

// Upstream validation
export const upstreamValidation = [
  body('host')
    .trim()
    .notEmpty()
    .withMessage('Host is required')
    .isString()
    .withMessage('Host must be a string')
    .custom((value) => {
      if (!isValidHost(value)) {
        throw new Error('Invalid host. Must be a valid IP address (IPv4/IPv6) or hostname');
      }
      return true;
    }),
  body('port')
    .isInt({ min: 1, max: 65535 })
    .withMessage('Port must be between 1 and 65535'),
  body('weight')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Weight must be between 1 and 100'),
  body('maxFails')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Max fails must be between 0 and 100'),
  body('failTimeout')
    .optional()
    .isInt({ min: 1, max: 3600 })
    .withMessage('Fail timeout must be between 1 and 3600 seconds'),
  body('maxConns')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max connections must be a positive integer'),
  body('backup')
    .optional()
    .isBoolean()
    .withMessage('Backup must be a boolean'),
  body('down')
    .optional()
    .isBoolean()
    .withMessage('Down must be a boolean'),
];

// Create NLB validation
export const createNLBValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Name can only contain letters, numbers, hyphens, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('port')
    .isInt({ min: 10000, max: 65535 })
    .withMessage('Port must be between 10000 and 65535'),
  body('protocol')
    .isIn(['tcp', 'udp', 'tcp_udp'])
    .withMessage('Protocol must be tcp, udp, or tcp_udp'),
  body('algorithm')
    .optional()
    .isIn(['round_robin', 'least_conn', 'ip_hash', 'hash'])
    .withMessage('Algorithm must be round_robin, least_conn, ip_hash, or hash'),
  body('upstreams')
    .isArray({ min: 1 })
    .withMessage('At least one upstream is required'),
  body('upstreams.*.host')
    .trim()
    .notEmpty()
    .withMessage('Upstream host is required')
    .custom((value) => {
      if (!isValidHost(value)) {
        throw new Error('Invalid host. Must be a valid IP address (IPv4/IPv6) or hostname');
      }
      return true;
    }),
  body('upstreams.*.port')
    .isInt({ min: 1, max: 65535 })
    .withMessage('Upstream port must be between 1 and 65535'),
  body('upstreams.*.weight')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Upstream weight must be between 1 and 100'),
  body('upstreams.*.maxFails')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Upstream max fails must be between 0 and 100'),
  body('upstreams.*.failTimeout')
    .optional()
    .isInt({ min: 1, max: 3600 })
    .withMessage('Upstream fail timeout must be between 1 and 3600 seconds'),
  body('upstreams.*.maxConns')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Upstream max connections must be a positive integer'),
  body('upstreams.*.backup')
    .optional()
    .isBoolean()
    .withMessage('Upstream backup must be a boolean'),
  body('upstreams.*.down')
    .optional()
    .isBoolean()
    .withMessage('Upstream down must be a boolean'),
  
  // Advanced settings
  body('proxyTimeout')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Proxy timeout must be between 1 and 600 seconds'),
  body('proxyConnectTimeout')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Proxy connect timeout must be between 1 and 60 seconds'),
  body('proxyNextUpstream')
    .optional()
    .isBoolean()
    .withMessage('Proxy next upstream must be a boolean'),
  body('proxyNextUpstreamTimeout')
    .optional()
    .isInt({ min: 0, max: 600 })
    .withMessage('Proxy next upstream timeout must be between 0 and 600 seconds'),
  body('proxyNextUpstreamTries')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Proxy next upstream tries must be between 0 and 10'),
  
  // Health check settings
  body('healthCheckEnabled')
    .optional()
    .isBoolean()
    .withMessage('Health check enabled must be a boolean'),
  body('healthCheckInterval')
    .optional()
    .isInt({ min: 5, max: 300 })
    .withMessage('Health check interval must be between 5 and 300 seconds'),
  body('healthCheckTimeout')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Health check timeout must be between 1 and 60 seconds'),
  body('healthCheckRises')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Health check rises must be between 1 and 10'),
  body('healthCheckFalls')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Health check falls must be between 1 and 10'),
];

// Update NLB validation
export const updateNLBValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Name can only contain letters, numbers, hyphens, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('port')
    .optional()
    .isInt({ min: 10000, max: 65535 })
    .withMessage('Port must be between 10000 and 65535'),
  body('protocol')
    .optional()
    .isIn(['tcp', 'udp', 'tcp_udp'])
    .withMessage('Protocol must be tcp, udp, or tcp_udp'),
  body('algorithm')
    .optional()
    .isIn(['round_robin', 'least_conn', 'ip_hash', 'hash'])
    .withMessage('Algorithm must be round_robin, least_conn, ip_hash, or hash'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'error'])
    .withMessage('Status must be active, inactive, or error'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
  body('upstreams')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one upstream is required'),
  body('upstreams.*.host')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Upstream host is required')
    .custom((value) => {
      if (value && !isValidHost(value)) {
        throw new Error('Invalid host. Must be a valid IP address (IPv4/IPv6) or hostname');
      }
      return true;
    }),
  body('upstreams.*.port')
    .optional()
    .isInt({ min: 1, max: 65535 })
    .withMessage('Upstream port must be between 1 and 65535'),
  
  // Advanced settings (same as create)
  body('proxyTimeout')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Proxy timeout must be between 1 and 600 seconds'),
  body('proxyConnectTimeout')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Proxy connect timeout must be between 1 and 60 seconds'),
  body('proxyNextUpstream')
    .optional()
    .isBoolean()
    .withMessage('Proxy next upstream must be a boolean'),
  
  // Health check settings
  body('healthCheckEnabled')
    .optional()
    .isBoolean()
    .withMessage('Health check enabled must be a boolean'),
  body('healthCheckInterval')
    .optional()
    .isInt({ min: 5, max: 300 })
    .withMessage('Health check interval must be between 5 and 300 seconds'),
];

// Query validation
export const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['name', 'port', 'status', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('search')
    .optional()
    .trim()
    .isString()
    .withMessage('Search must be a string'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'error'])
    .withMessage('Status must be active, inactive, or error'),
  query('protocol')
    .optional()
    .isIn(['tcp', 'udp', 'tcp_udp'])
    .withMessage('Protocol must be tcp, udp, or tcp_udp'),
  query('enabled')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Enabled must be true or false'),
];

// ID parameter validation
export const idValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('ID is required')
    .isString()
    .withMessage('ID must be a string'),
];

// Toggle enabled validation
export const toggleEnabledValidation = [
  body('enabled')
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
];
