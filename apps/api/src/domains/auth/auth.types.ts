import { User, TwoFactorAuth, RefreshToken } from '@prisma/client';

/**
 * Auth domain types
 */

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  timezone: string;
  language: string;
  lastLogin: Date | null;
}

export interface LoginResult {
  user: UserData;
  accessToken: string;
  refreshToken: string;
  requirePasswordChange?: boolean;
  require2FASetup?: boolean;
}

export interface Login2FARequiredResult {
  requires2FA: true;
  userId: string;
  user: UserData;
}

export interface LoginFirstTimeResult {
  requirePasswordChange: true;
  userId: string;
  tempToken: string;
  user: UserData;
}

export type LoginResponse = LoginResult | Login2FARequiredResult | LoginFirstTimeResult;

export interface RefreshTokenResult {
  accessToken: string;
}

export interface RequestMetadata {
  ip: string;
  userAgent: string;
}

export type UserWithTwoFactor = User & {
  twoFactor: TwoFactorAuth | null;
};

export type RefreshTokenWithUser = RefreshToken & {
  user: User;
};
