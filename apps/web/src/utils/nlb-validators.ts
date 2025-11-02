/**
 * Network Load Balancer Validation Utilities
 * Validates NLB configuration to prevent nginx errors
 */

/**
 * Validate IP address (IPv4 or IPv6) or hostname
 */
export function isValidHost(host: string): boolean {
  if (!host || host.trim().length === 0) {
    return false;
  }

  // Remove whitespace
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
  // Must start with letter or digit, can contain letters, digits, hyphens, dots
  // Each label must be 1-63 chars, total max 253 chars
  // Cannot start or end with hyphen or dot
  const hostnameRegex = /^(?=.{1,253}$)(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)*(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/;
  
  // Additional check: hostname labels cannot be all numeric (to avoid confusion with IPs)
  if (hostnameRegex.test(host)) {
    const labels = host.split('.');
    // If all labels are numeric, it's trying to be an IP, reject it
    const allNumeric = labels.every(label => /^\d+$/.test(label));
    if (allNumeric) {
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Validate port number
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * Validate NLB listening port (must be >= 10000 to avoid conflicts)
 */
export function isValidNLBPort(port: number): boolean {
  return Number.isInteger(port) && port >= 10000 && port <= 65535;
}

/**
 * Validate weight value
 */
export function isValidWeight(weight: number): boolean {
  return Number.isInteger(weight) && weight >= 1 && weight <= 100;
}

/**
 * Validate max fails
 */
export function isValidMaxFails(maxFails: number): boolean {
  return Number.isInteger(maxFails) && maxFails >= 0 && maxFails <= 100;
}

/**
 * Validate fail timeout (in seconds)
 */
export function isValidFailTimeout(timeout: number): boolean {
  return Number.isInteger(timeout) && timeout >= 1 && timeout <= 3600;
}

/**
 * Validate max connections
 */
export function isValidMaxConns(maxConns: number): boolean {
  return Number.isInteger(maxConns) && maxConns >= 0 && maxConns <= 100000;
}

/**
 * Validate proxy timeout (in seconds)
 */
export function isValidProxyTimeout(timeout: number): boolean {
  return Number.isInteger(timeout) && timeout >= 1 && timeout <= 3600;
}

/**
 * Validate proxy connect timeout (in seconds)
 */
export function isValidProxyConnectTimeout(timeout: number): boolean {
  return Number.isInteger(timeout) && timeout >= 1 && timeout <= 300;
}

/**
 * Validate proxy next upstream timeout (in seconds, 0 = disabled)
 */
export function isValidProxyNextUpstreamTimeout(timeout: number): boolean {
  return Number.isInteger(timeout) && timeout >= 0 && timeout <= 3600;
}

/**
 * Validate proxy next upstream tries (0 = unlimited)
 */
export function isValidProxyNextUpstreamTries(tries: number): boolean {
  return Number.isInteger(tries) && tries >= 0 && tries <= 100;
}

/**
 * Validate health check interval (in seconds)
 */
export function isValidHealthCheckInterval(interval: number): boolean {
  return Number.isInteger(interval) && interval >= 5 && interval <= 3600;
}

/**
 * Validate health check timeout (in seconds)
 */
export function isValidHealthCheckTimeout(timeout: number): boolean {
  return Number.isInteger(timeout) && timeout >= 1 && timeout <= 300;
}

/**
 * Validate health check rises
 */
export function isValidHealthCheckRises(rises: number): boolean {
  return Number.isInteger(rises) && rises >= 1 && rises <= 10;
}

/**
 * Validate health check falls
 */
export function isValidHealthCheckFalls(falls: number): boolean {
  return Number.isInteger(falls) && falls >= 1 && falls <= 10;
}

/**
 * Validate NLB name
 */
export function isValidNLBName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (name.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Name must not exceed 50 characters' };
  }

  // Only allow alphanumeric, dash, underscore
  const nameRegex = /^[a-zA-Z0-9\-_]+$/;
  if (!nameRegex.test(name)) {
    return { 
      valid: false, 
      error: 'Name can only contain letters, numbers, dashes, and underscores' 
    };
  }

  // Cannot start or end with dash/underscore
  if (/^[-_]|[-_]$/.test(name)) {
    return { 
      valid: false, 
      error: 'Name cannot start or end with dash or underscore' 
    };
  }

  return { valid: true };
}

/**
 * Validate upstream host
 */
export function validateUpstreamHost(host: string): { valid: boolean; error?: string } {
  if (!host || host.trim().length === 0) {
    return { valid: false, error: 'Host is required' };
  }

  if (!isValidHost(host)) {
    return { 
      valid: false, 
      error: 'Invalid host. Enter a valid IP address (IPv4/IPv6) or hostname' 
    };
  }

  return { valid: true };
}

/**
 * Validate upstream port
 */
export function validateUpstreamPort(port: number): { valid: boolean; error?: string } {
  if (!port) {
    return { valid: false, error: 'Port is required' };
  }

  if (!isValidPort(port)) {
    return { 
      valid: false, 
      error: 'Port must be between 1 and 65535' 
    };
  }

  return { valid: true };
}

/**
 * Validate upstream configuration
 */
export function validateUpstream(upstream: {
  host: string;
  port: number;
  weight: number;
  maxFails: number;
  failTimeout: number;
  maxConns: number;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate host
  const hostValidation = validateUpstreamHost(upstream.host);
  if (!hostValidation.valid) {
    errors.host = hostValidation.error || 'Invalid host';
  }

  // Validate port
  const portValidation = validateUpstreamPort(upstream.port);
  if (!portValidation.valid) {
    errors.port = portValidation.error || 'Invalid port';
  }

  // Validate weight
  if (!isValidWeight(upstream.weight)) {
    errors.weight = 'Weight must be between 1 and 100';
  }

  // Validate maxFails
  if (!isValidMaxFails(upstream.maxFails)) {
    errors.maxFails = 'Max fails must be between 0 and 100';
  }

  // Validate failTimeout
  if (!isValidFailTimeout(upstream.failTimeout)) {
    errors.failTimeout = 'Fail timeout must be between 1 and 3600 seconds';
  }

  // Validate maxConns
  if (!isValidMaxConns(upstream.maxConns)) {
    errors.maxConns = 'Max connections must be between 0 and 100000';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate complete NLB configuration
 */
export function validateNLBConfig(config: {
  name: string;
  port: number;
  upstreams: Array<{
    host: string;
    port: number;
    weight: number;
    maxFails: number;
    failTimeout: number;
    maxConns: number;
    backup: boolean;
    down: boolean;
  }>;
  proxyTimeout: number;
  proxyConnectTimeout: number;
  proxyNextUpstreamTimeout: number;
  proxyNextUpstreamTries: number;
  healthCheckEnabled: boolean;
  healthCheckInterval?: number;
  healthCheckTimeout?: number;
  healthCheckRises?: number;
  healthCheckFalls?: number;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate name
  const nameValidation = isValidNLBName(config.name);
  if (!nameValidation.valid) {
    errors.name = nameValidation.error || 'Invalid name';
  }

  // Validate port
  if (!isValidNLBPort(config.port)) {
    errors.port = 'Port must be between 10000 and 65535';
  }

  // Validate upstreams
  if (!config.upstreams || config.upstreams.length === 0) {
    errors.upstreams = 'At least one upstream is required';
  } else {
    // Check for duplicate upstreams
    const upstreamKeys = new Set<string>();
    const duplicates: string[] = [];

    config.upstreams.forEach((upstream) => {
      const key = `${upstream.host}:${upstream.port}`;
      if (upstreamKeys.has(key)) {
        duplicates.push(key);
      }
      upstreamKeys.add(key);
    });

    if (duplicates.length > 0) {
      errors.upstreams = `Duplicate upstreams detected: ${duplicates.join(', ')}`;
    }

    // Check if all upstreams are marked as down or backup
    const activeUpstreams = config.upstreams.filter(u => !u.down && !u.backup);
    if (activeUpstreams.length === 0) {
      errors.upstreams = 'At least one upstream must be active (not marked as down or backup)';
    }
  }

  // Validate proxy settings
  if (!isValidProxyTimeout(config.proxyTimeout)) {
    errors.proxyTimeout = 'Proxy timeout must be between 1 and 3600 seconds';
  }

  if (!isValidProxyConnectTimeout(config.proxyConnectTimeout)) {
    errors.proxyConnectTimeout = 'Proxy connect timeout must be between 1 and 300 seconds';
  }

  if (!isValidProxyNextUpstreamTimeout(config.proxyNextUpstreamTimeout)) {
    errors.proxyNextUpstreamTimeout = 'Proxy next upstream timeout must be between 0 and 3600 seconds';
  }

  if (!isValidProxyNextUpstreamTries(config.proxyNextUpstreamTries)) {
    errors.proxyNextUpstreamTries = 'Proxy next upstream tries must be between 0 and 100';
  }

  // Validate health check settings if enabled
  if (config.healthCheckEnabled) {
    if (config.healthCheckInterval !== undefined && !isValidHealthCheckInterval(config.healthCheckInterval)) {
      errors.healthCheckInterval = 'Health check interval must be between 5 and 3600 seconds';
    }

    if (config.healthCheckTimeout !== undefined && !isValidHealthCheckTimeout(config.healthCheckTimeout)) {
      errors.healthCheckTimeout = 'Health check timeout must be between 1 and 300 seconds';
    }

    if (config.healthCheckRises !== undefined && !isValidHealthCheckRises(config.healthCheckRises)) {
      errors.healthCheckRises = 'Health check rises must be between 1 and 10';
    }

    if (config.healthCheckFalls !== undefined && !isValidHealthCheckFalls(config.healthCheckFalls)) {
      errors.healthCheckFalls = 'Health check falls must be between 1 and 10';
    }

    // Health check timeout must be less than interval
    if (
      config.healthCheckTimeout !== undefined &&
      config.healthCheckInterval !== undefined &&
      config.healthCheckTimeout >= config.healthCheckInterval
    ) {
      errors.healthCheckTimeout = 'Health check timeout must be less than interval';
    }
  }

  // Proxy connect timeout should be less than proxy timeout
  if (config.proxyConnectTimeout >= config.proxyTimeout) {
    errors.proxyConnectTimeout = 'Proxy connect timeout should be less than proxy timeout';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Get validation hints for specific fields
 */
export function getValidationHints(field: string): string {
  const hints: Record<string, string> = {
    name: 'Use 3-50 characters: letters, numbers, dashes, underscores',
    port: 'Port must be between 10000-65535 to avoid conflicts',
    host: 'Enter IP address (IPv4/IPv6) or hostname',
    upstreamPort: 'Port must be between 1-65535',
    weight: 'Weight determines traffic distribution (1-100)',
    maxFails: 'Number of failed attempts before marking server down (0-100)',
    failTimeout: 'Time to wait before retrying failed server (1-3600s)',
    maxConns: 'Maximum concurrent connections (0 = unlimited)',
    proxyTimeout: 'Maximum time to wait for upstream response (1-3600s)',
    proxyConnectTimeout: 'Maximum time to establish connection (1-300s)',
    healthCheckInterval: 'Time between health checks (5-3600s)',
    healthCheckTimeout: 'Maximum time to wait for health check response (1-300s)',
  };

  return hints[field] || '';
}

/**
 * Get example values for fields
 */
export function getExampleValue(field: string): string {
  const examples: Record<string, string> = {
    name: 'my-load-balancer',
    host: '192.168.1.100 or backend.example.com',
    port: '10000',
    upstreamPort: '80 or 443',
    weight: '1',
    maxFails: '3',
    failTimeout: '10',
    maxConns: '0',
    proxyTimeout: '3',
    proxyConnectTimeout: '1',
    healthCheckInterval: '10',
    healthCheckTimeout: '5',
  };

  return examples[field] || '';
}

/**
 * Check for common configuration issues
 */
export function checkConfigurationWarnings(config: {
  upstreams: Array<{
    host: string;
    port: number;
    weight: number;
    maxFails: number;
    failTimeout: number;
    backup: boolean;
    down: boolean;
  }>;
  proxyTimeout: number;
  proxyConnectTimeout: number;
  healthCheckEnabled: boolean;
  healthCheckInterval?: number;
  healthCheckTimeout?: number;
}): string[] {
  const warnings: string[] = [];

  // Check if all upstreams have the same weight
  const weights = config.upstreams.map(u => u.weight);
  if (new Set(weights).size === 1 && weights[0] !== 1) {
    warnings.push('All upstreams have the same weight. Consider using weight=1 for simplicity.');
  }

  // Check if proxy timeout is very high
  if (config.proxyTimeout > 300) {
    warnings.push('Proxy timeout is very high (>5 minutes). This may cause long waits for clients.');
  }

  // Check if health check is disabled
  if (!config.healthCheckEnabled) {
    warnings.push('Health checks are disabled. Failed upstreams will not be automatically detected.');
  }

  // Check if health check interval is too frequent
  if (config.healthCheckEnabled && config.healthCheckInterval && config.healthCheckInterval < 10) {
    warnings.push('Health check interval is very frequent (<10s). This may increase server load.');
  }

  // Check if backup servers exist without active servers
  const hasBackup = config.upstreams.some(u => u.backup);
  const hasActive = config.upstreams.some(u => !u.backup && !u.down);
  if (hasBackup && !hasActive) {
    warnings.push('Only backup servers configured. They will only be used when all primary servers are down.');
  }

  return warnings;
}
