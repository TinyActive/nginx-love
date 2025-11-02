/**
 * Access List Validation Utilities
 * Provides validation for Access List form fields
 */

import { isValidIpOrCidr } from './acl-validators';

/**
 * Validate access list name
 */
export function validateAccessListName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  if (name.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Name must not exceed 100 characters' };
  }

  // Only allow letters, numbers, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { valid: false, error: 'Name can only contain letters, numbers, underscores, and hyphens' };
  }

  return { valid: true };
}

/**
 * Validate IP address for access list
 */
export function validateAccessListIp(ip: string): { valid: boolean; error?: string } {
  if (!ip || ip.trim().length === 0) {
    return { valid: false, error: 'IP address is required' };
  }

  if (!isValidIpOrCidr(ip)) {
    return { valid: false, error: 'Invalid IP address or CIDR notation. Examples: 192.168.1.1 or 192.168.1.0/24' };
  }

  return { valid: true };
}

/**
 * Validate username for HTTP Basic Auth
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 50) {
    return { valid: false, error: 'Username must not exceed 50 characters' };
  }

  // Only allow letters, numbers, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { valid: true };
}

/**
 * Validate password for HTTP Basic Auth
 */
export function validatePassword(password: string, isRequired: boolean = true): { valid: boolean; error?: string } {
  // In edit mode, password might be optional (empty = keep existing)
  if (!isRequired && (!password || password.length === 0)) {
    return { valid: true };
  }

  if (!password || password.trim().length === 0) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 4) {
    return { valid: false, error: 'Password must be at least 4 characters' };
  }

  return { valid: true };
}

/**
 * Validate description
 */
export function validateDescription(description: string, maxLength: number = 500): { valid: boolean; error?: string } {
  if (description && description.length > maxLength) {
    return { valid: false, error: `Description must not exceed ${maxLength} characters` };
  }

  return { valid: true };
}

/**
 * Get validation hints for access list fields
 */
export function getAccessListHints(field: string): string {
  const hints: Record<string, string> = {
    name: 'Use only letters, numbers, underscores, and hyphens (3-100 characters)',
    ip: 'Enter a valid IP address (e.g., 192.168.1.1) or CIDR notation (e.g., 192.168.1.0/24)',
    username: 'Use only letters, numbers, underscores, and hyphens (3-50 characters)',
    password: 'Minimum 4 characters. In edit mode, leave empty to keep existing password',
    description: 'Optional description for this item (max 500 characters)'
  };

  return hints[field] || '';
}

/**
 * Get example values for access list fields
 */
export function getAccessListExample(field: string): string {
  const examples: Record<string, string> = {
    name: 'admin-panel-access',
    ip: '192.168.1.1',
    ipCidr: '192.168.1.0/24',
    username: 'admin_user',
    password: '••••••••',
    description: 'Access for admin panel'
  };

  return examples[field] || '';
}
