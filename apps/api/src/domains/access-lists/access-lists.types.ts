import { AccessList, AccessListAuthUser, AccessListDomain } from '@prisma/client';

/**
 * Access Lists domain types and enums
 */

export enum AccessListType {
  IP_WHITELIST = 'ip_whitelist',
  HTTP_BASIC_AUTH = 'http_basic_auth',
  COMBINED = 'combined'
}

/**
 * Access List with relations and deserialized arrays
 */
export type AccessListWithRelations = Omit<AccessList, 'allowedIps'> & {
  allowedIps: string[]; // Deserialized from JSON string in database
  authUsers?: AccessListAuthUser[];
  domains?: (AccessListDomain & {
    domain: {
      id: string;
      name: string;
      status: string;
    };
  })[];
};

/**
 * Create Access List input
 */
export interface CreateAccessListInput {
  name: string;
  description?: string;
  type: AccessListType;
  enabled?: boolean;
  allowedIps?: string[];
  authUsers?: CreateAuthUserInput[];
  domainIds?: string[];
}

/**
 * Update Access List input
 */
export interface UpdateAccessListInput {
  name?: string;
  description?: string;
  type?: AccessListType;
  enabled?: boolean;
  allowedIps?: string[];
  authUsers?: CreateAuthUserInput[];
  domainIds?: string[];
}

/**
 * Create Auth User input
 */
export interface CreateAuthUserInput {
  username: string;
  password: string;
  description?: string;
}

/**
 * Update Auth User input
 */
export interface UpdateAuthUserInput {
  username?: string;
  password?: string;
  description?: string;
}

/**
 * Access List query options
 */
export interface AccessListQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: AccessListType;
  enabled?: boolean;
}

/**
 * Apply Access List to domain input
 */
export interface ApplyAccessListToDomainInput {
  accessListId: string;
  domainId: string;
  enabled?: boolean;
}

/**
 * Nginx configuration result
 */
export interface NginxConfigResult {
  success: boolean;
  message: string;
  configPath?: string;
}

/**
 * Access List statistics
 */
export interface AccessListStats {
  totalAccessLists: number;
  enabledAccessLists: number;
  totalAuthUsers: number;
  totalAssignedDomains: number;
}
