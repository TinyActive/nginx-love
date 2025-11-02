/**
 * ACL Validation Utilities
 * Provides comprehensive validation for ACL rule values to prevent nginx configuration errors
 */

/**
 * Validate IP address (IPv4 or IPv6)
 */
export function isValidIpAddress(ip: string): boolean {
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 validation (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Validate CIDR notation (e.g., 192.168.1.0/24)
 */
export function isValidCidr(cidr: string): boolean {
  const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
  
  // IPv6 CIDR
  const cidrV6Regex = /^(?:[0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{0,4}\/(?:[0-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8])$/;
  
  return cidrRegex.test(cidr) || cidrV6Regex.test(cidr);
}

/**
 * Validate IP or CIDR
 */
export function isValidIpOrCidr(value: string): boolean {
  return isValidIpAddress(value) || isValidCidr(value);
}

/**
 * Validate regex pattern (check if it's a valid regex)
 */
export function isValidRegex(pattern: string): { valid: boolean; error?: string } {
  try {
    new RegExp(pattern);
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate URL pattern for nginx location matching
 */
export function isValidUrlPattern(pattern: string): boolean {
  // URL pattern should not be empty and should be a valid path
  if (!pattern || pattern.trim().length === 0) {
    return false;
  }
  
  // Check for dangerous characters that could break nginx config
  const dangerousChars = /[;<>{}|\\]/;
  if (dangerousChars.test(pattern)) {
    return false;
  }
  
  return true;
}

/**
 * Validate HTTP method
 */
export function isValidHttpMethod(method: string): boolean {
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'];
  return validMethods.includes(method.toUpperCase());
}

/**
 * Validate GeoIP country code (ISO 3166-1 alpha-2)
 */
export function isValidCountryCode(code: string): boolean {
  // Basic validation: 2 uppercase letters
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Validate User-Agent pattern
 */
export function isValidUserAgentPattern(pattern: string): boolean {
  if (!pattern || pattern.trim().length === 0) {
    return false;
  }
  
  // Check for dangerous characters
  const dangerousChars = /[;<>{}|\\]/;
  if (dangerousChars.test(pattern)) {
    return false;
  }
  
  return true;
}

/**
 * Validate header name
 */
export function isValidHeaderName(name: string): boolean {
  // HTTP header names should only contain alphanumeric, dash, and underscore
  return /^[a-zA-Z0-9\-_]+$/.test(name);
}

/**
 * Sanitize value to prevent nginx config injection
 */
export function sanitizeValue(value: string): string {
  // Remove or escape dangerous characters
  return value
    .replace(/[;<>{}|\\]/g, '') // Remove dangerous chars
    .replace(/\$/g, '\\$')      // Escape dollar signs
    .trim();
}

/**
 * Validate ACL rule value based on field and operator
 */
export function validateAclValue(
  field: string,
  operator: string,
  value: string
): { valid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: 'Value cannot be empty' };
  }

  switch (field) {
    case 'ip':
      if (operator === 'equals' || operator === 'contains') {
        if (!isValidIpOrCidr(value)) {
          return { 
            valid: false, 
            error: 'Invalid IP address or CIDR notation. Examples: 192.168.1.1 or 192.168.1.0/24' 
          };
        }
      } else if (operator === 'regex') {
        const regexCheck = isValidRegex(value);
        if (!regexCheck.valid) {
          return { 
            valid: false, 
            error: `Invalid regex pattern: ${regexCheck.error}` 
          };
        }
      }
      break;

    case 'geoip':
      if (operator === 'equals') {
        if (!isValidCountryCode(value)) {
          return { 
            valid: false, 
            error: 'Invalid country code. Use ISO 3166-1 alpha-2 format (e.g., US, CN, VN)' 
          };
        }
      } else if (operator === 'regex') {
        const regexCheck = isValidRegex(value);
        if (!regexCheck.valid) {
          return { 
            valid: false, 
            error: `Invalid regex pattern: ${regexCheck.error}` 
          };
        }
      }
      break;

    case 'user_agent':
      if (operator === 'regex') {
        const regexCheck = isValidRegex(value);
        if (!regexCheck.valid) {
          return { 
            valid: false, 
            error: `Invalid regex pattern: ${regexCheck.error}` 
          };
        }
      } else if (!isValidUserAgentPattern(value)) {
        return { 
          valid: false, 
          error: 'Invalid user-agent pattern. Avoid special characters like ; < > { } | \\' 
        };
      }
      break;

    case 'url':
      if (operator === 'regex') {
        const regexCheck = isValidRegex(value);
        if (!regexCheck.valid) {
          return { 
            valid: false, 
            error: `Invalid regex pattern: ${regexCheck.error}` 
          };
        }
      } else if (!isValidUrlPattern(value)) {
        return { 
          valid: false, 
          error: 'Invalid URL pattern. Avoid special characters like ; < > { } | \\' 
        };
      }
      break;

    case 'method':
      if (operator === 'equals' && !isValidHttpMethod(value)) {
        return { 
          valid: false, 
          error: 'Invalid HTTP method. Valid methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS' 
        };
      }
      break;

    case 'header':
      // For header field, value should be in format "Header-Name: value"
      const headerParts = value.split(':');
      if (headerParts.length < 2) {
        return { 
          valid: false, 
          error: 'Header value must be in format "Header-Name: value"' 
        };
      }
      
      const headerName = headerParts[0].trim();
      if (!isValidHeaderName(headerName)) {
        return { 
          valid: false, 
          error: 'Invalid header name. Use only alphanumeric, dash, and underscore characters' 
        };
      }
      break;

    default:
      return { valid: false, error: `Unknown field type: ${field}` };
  }

  return { valid: true };
}

/**
 * Get validation hints for a specific field type
 */
export function getValidationHints(field: string, operator: string): string {
  const hints: Record<string, Record<string, string>> = {
    ip: {
      equals: 'Enter a valid IP address (e.g., 192.168.1.1)',
      contains: 'Enter a valid CIDR notation (e.g., 192.168.1.0/24)',
      regex: 'Enter a valid regex pattern for IP matching'
    },
    geoip: {
      equals: 'Enter a 2-letter country code (e.g., US, CN, VN)',
      contains: 'Enter country codes separated by comma',
      regex: 'Enter a regex pattern for country codes'
    },
    user_agent: {
      equals: 'Enter exact user-agent string',
      contains: 'Enter a substring to match in user-agent',
      regex: 'Enter a regex pattern (e.g., (bot|crawler|spider))'
    },
    url: {
      equals: 'Enter exact URL path (e.g., /admin)',
      contains: 'Enter a substring to match in URL',
      regex: 'Enter a regex pattern (e.g., \\.(php|asp)$)'
    },
    method: {
      equals: 'Enter HTTP method (GET, POST, PUT, DELETE, etc.)',
      contains: 'Enter HTTP method substring',
      regex: 'Enter regex pattern for HTTP methods'
    },
    header: {
      equals: 'Enter in format "Header-Name: value"',
      contains: 'Enter in format "Header-Name: value"',
      regex: 'Enter in format "Header-Name: regex-pattern"'
    }
  };

  return hints[field]?.[operator] || 'Enter a valid value';
}
