import { UserRole, UserStatus } from '../../../shared/types/common.types';

/**
 * DTO for querying users
 */
export interface UserQueryDto {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

/**
 * Parse query parameters into UserQueryDto
 */
export function parseUserQueryDto(query: any): UserQueryDto {
  const dto: UserQueryDto = {};

  if (query.role && ['admin', 'moderator', 'viewer'].includes(query.role)) {
    dto.role = query.role as UserRole;
  }

  if (query.status && ['active', 'inactive', 'suspended'].includes(query.status)) {
    dto.status = query.status as UserStatus;
  }

  if (query.search && typeof query.search === 'string') {
    dto.search = query.search.trim();
  }

  return dto;
}
