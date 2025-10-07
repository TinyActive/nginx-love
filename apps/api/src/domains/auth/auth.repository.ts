import prisma from '../../config/database';
import { UserWithTwoFactor, RefreshTokenWithUser, RequestMetadata } from './auth.types';
import { ActivityType } from '@prisma/client';

/**
 * Auth repository - Handles all Prisma database operations for authentication
 */
export class AuthRepository {
  /**
   * Find user by username with 2FA info
   */
  async findUserByUsername(username: string): Promise<UserWithTwoFactor | null> {
    return prisma.user.findUnique({
      where: { username },
      include: {
        twoFactor: true,
      },
    });
  }

  /**
   * Find user by ID with 2FA info
   */
  async findUserById(userId: string): Promise<UserWithTwoFactor | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        twoFactor: true,
      },
    });
  }

  /**
   * Create activity log entry
   */
  async createActivityLog(
    userId: string | null,
    action: string,
    type: ActivityType,
    metadata: RequestMetadata,
    success: boolean,
    details?: string
  ): Promise<void> {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        type,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        success,
        details,
      },
    });
  }

  /**
   * Save refresh token to database
   */
  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }

  /**
   * Create user session
   */
  async createUserSession(
    userId: string,
    sessionId: string,
    metadata: RequestMetadata,
    expiresAt: Date
  ): Promise<void> {
    await prisma.userSession.create({
      data: {
        userId,
        sessionId,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        device: 'Web Browser',
        expiresAt,
      },
    });
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Find refresh token by token string
   */
  async findRefreshToken(token: string): Promise<RefreshTokenWithUser | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /**
   * Check if refresh token is valid (exists, not revoked, not expired)
   */
  isRefreshTokenValid(tokenRecord: RefreshTokenWithUser): boolean {
    if (tokenRecord.revokedAt) {
      return false;
    }
    if (new Date() > tokenRecord.expiresAt) {
      return false;
    }
    return true;
  }
}
