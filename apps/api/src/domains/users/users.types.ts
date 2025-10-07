import { UserRole, UserStatus } from '../../shared/types/common.types';

/**
 * User domain types
 */

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string | null;
  phone?: string | null;
  timezone: string;
  language: string;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface UserWithProfile extends User {
  profile?: any | null;
  twoFactor?: {
    enabled: boolean;
  } | null;
}

export interface UserStatistics {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  byRole: {
    admin: number;
    moderator: number;
    viewer: number;
  };
  recentLogins: number;
}

/**
 * User select fields (excludes password)
 */
export const USER_SELECT_FIELDS = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  avatar: true,
  phone: true,
  timezone: true,
  language: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * User select fields with profile
 */
export const USER_WITH_PROFILE_SELECT_FIELDS = {
  ...USER_SELECT_FIELDS,
  profile: true,
  twoFactor: {
    select: {
      enabled: true,
    },
  },
} as const;
