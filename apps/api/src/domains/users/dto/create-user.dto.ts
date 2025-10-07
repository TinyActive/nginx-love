import { UserRole, UserStatus } from '../../../shared/types/common.types';

/**
 * DTO for creating a new user
 */
export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
  timezone?: string;
  language?: string;
}

/**
 * Validate create user DTO
 */
export function validateCreateUserDto(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.username || typeof data.username !== 'string' || data.username.trim() === '') {
    errors.push('Username is required');
  }

  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password is required and must be at least 6 characters');
  }

  if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim() === '') {
    errors.push('Full name is required');
  }

  if (data.role && !['admin', 'moderator', 'viewer'].includes(data.role)) {
    errors.push('Invalid role. Must be admin, moderator, or viewer');
  }

  if (data.status && !['active', 'inactive', 'suspended'].includes(data.status)) {
    errors.push('Invalid status. Must be active, inactive, or suspended');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
