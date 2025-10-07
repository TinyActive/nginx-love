/**
 * Common types used across the application
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta;
}

export type UserRole = 'admin' | 'moderator' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type DomainStatus = 'active' | 'inactive';
export type LogLevel = 'info' | 'warning' | 'error';
export type LogType = 'access' | 'error' | 'system';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
