import prisma from '../../config/database';
import { ActivityType } from '@prisma/client';
import { UserWithTwoFactor, RequestMetadata, SessionData } from './account.types';

/**
 * Account repository - Handles all Prisma database operations for account management
 */
export class AccountRepository {
  /**
   * Find user by ID with related data
   */
  async findUserById(userId: string): Promise<UserWithTwoFactor | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        twoFactor: true,
      },
    });
  }

  /**
   * Find user by email (excluding a specific user ID)
   */
  async findUserByEmail(email: string, excludeUserId?: string): Promise<UserWithTwoFactor | null> {
    return prisma.user.findFirst({
      where: {
        email,
        ...(excludeUserId && { NOT: { id: excludeUserId } }),
      },
      include: {
        twoFactor: true,
      },
    });
  }

  /**
   * Update user profile information
   */
  async updateUser(
    userId: string,
    data: {
      fullName?: string;
      email?: string;
      phone?: string | null;
      timezone?: string;
      language?: string;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Find two-factor auth record by user ID
   */
  async findTwoFactorAuth(userId: string) {
    return prisma.twoFactorAuth.findUnique({
      where: { userId },
    });
  }

  /**
   * Upsert two-factor auth record
   */
  async upsertTwoFactorAuth(
    userId: string,
    data: {
      enabled: boolean;
      secret?: string;
      backupCodes?: string[];
    }
  ) {
    return prisma.twoFactorAuth.upsert({
      where: { userId },
      create: {
        userId,
        enabled: data.enabled,
        secret: data.secret,
        backupCodes: data.backupCodes,
      },
      update: {
        enabled: data.enabled,
        ...(data.secret && { secret: data.secret }),
        ...(data.backupCodes && { backupCodes: data.backupCodes }),
      },
    });
  }

  /**
   * Update two-factor auth enabled status
   */
  async updateTwoFactorAuthStatus(userId: string, enabled: boolean): Promise<void> {
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { enabled },
    });
  }

  /**
   * Create activity log entry
   */
  async createActivityLog(
    userId: string,
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
   * Get activity logs for a user with pagination
   */
  async getActivityLogs(userId: string, skip: number, take: number) {
    return Promise.all([
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        skip,
        take,
      }),
      prisma.activityLog.count({ where: { userId } }),
    ]);
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<SessionData[]> {
    return prisma.userSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActive: 'desc' },
    });
  }

  /**
   * Revoke a session by session ID
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await prisma.userSession.delete({
      where: {
        sessionId,
        userId, // Ensure user can only revoke their own sessions
      },
    });
  }
}
