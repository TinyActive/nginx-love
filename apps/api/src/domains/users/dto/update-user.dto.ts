import { UserRole, UserStatus } from '../../../shared/types/common.types';

/**
 * DTO for updating a user
 */
export interface UpdateUserDto {
  username?: string;
  email?: string;
  fullName?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
  timezone?: string;
  language?: string;
  avatar?: string;
}

/**
 * DTO for self-update (limited fields)
 */
export interface SelfUpdateUserDto {
  fullName?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  avatar?: string;
}

/**
 * DTO for status update
 */
export interface UpdateUserStatusDto {
  status: UserStatus;
}

/**
 * Validate update user DTO
 */
export function validateUpdateUserDto(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.username !== undefined && (typeof data.username !== 'string' || data.username.trim() === '')) {
    errors.push('Username must be a non-empty string');
  }

  if (data.email !== undefined) {
    if (typeof data.email !== 'string' || data.email.trim() === '') {
      errors.push('Email must be a non-empty string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }
  }

  if (data.fullName !== undefined && (typeof data.fullName !== 'string' || data.fullName.trim() === '')) {
    errors.push('Full name must be a non-empty string');
  }

  if (data.role !== undefined && !['admin', 'moderator', 'viewer'].includes(data.role)) {
    errors.push('Invalid role. Must be admin, moderator, or viewer');
  }

  if (data.status !== undefined && !['active', 'inactive', 'suspended'].includes(data.status)) {
    errors.push('Invalid status. Must be active, inactive, or suspended');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate status update DTO
 */
export function validateUpdateUserStatusDto(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.status) {
    errors.push('Status is required');
  } else if (!['active', 'inactive', 'suspended'].includes(data.status)) {
    errors.push('Invalid status. Must be active, inactive, or suspended');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
