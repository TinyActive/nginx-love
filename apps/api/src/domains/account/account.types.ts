import { User, TwoFactorAuth, UserSession, ActivityLog } from '@prisma/client';

/**
 * Account domain types
 */

export interface ProfileData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  timezone: string;
  language: string;
  createdAt: Date;
  lastLogin: Date | null;
  twoFactorEnabled: boolean;
}

export interface UpdatedProfileData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  timezone: string;
  language: string;
}

export interface TwoFactorSetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorStatusData {
  enabled: boolean;
  method: string;
}

export interface ActivityLogData {
  logs: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RequestMetadata {
  ip: string;
  userAgent: string;
}

export type UserWithTwoFactor = User & {
  twoFactor: TwoFactorAuth | null;
  profile?: any;
};

export type SessionData = UserSession;
