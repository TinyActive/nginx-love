import { hashPassword, comparePassword } from '../../utils/password';
import logger from '../../utils/logger';
import { AccountRepository } from './account.repository';
import { TwoFactorService } from './services/two-factor.service';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  Enable2FADto,
} from './dto';
import {
  ProfileData,
  UpdatedProfileData,
  TwoFactorSetupData,
  TwoFactorStatusData,
  ActivityLogData,
  RequestMetadata,
  SessionData,
} from './account.types';
import {
  AuthenticationError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../shared/errors/app-error';

/**
 * Account service - Contains all account management business logic
 */
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly twoFactorService: TwoFactorService
  ) {}

  /**
   * Get user profile information
   */
  async getProfile(userId: string): Promise<ProfileData> {
    const user = await this.accountRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      timezone: user.timezone,
      language: user.language,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      twoFactorEnabled: user.twoFactor?.enabled || false,
    };
  }

  /**
   * Update user profile information
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    metadata: RequestMetadata
  ): Promise<UpdatedProfileData> {
    const { fullName, email, phone, timezone, language } = dto;

    // Check if email already exists (if changing)
    if (email) {
      const existingUser = await this.accountRepository.findUserByEmail(email, userId);

      if (existingUser) {
        throw new ConflictError('Email already in use');
      }
    }

    // Update user
    const updatedUser = await this.accountRepository.updateUser(userId, {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(timezone && { timezone }),
      ...(language && { language }),
    });

    // Log activity
    await this.accountRepository.createActivityLog(
      userId,
      'Updated profile information',
      'user_action',
      metadata,
      true
    );

    logger.info(`User ${userId} updated profile`);

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      phone: updatedUser.phone,
      timezone: updatedUser.timezone,
      language: updatedUser.language,
    };
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    metadata: RequestMetadata
  ): Promise<void> {
    const { currentPassword, newPassword } = dto;

    const user = await this.accountRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      // Log failed attempt
      await this.accountRepository.createActivityLog(
        userId,
        'Failed password change attempt',
        'security',
        metadata,
        false,
        'Invalid current password'
      );

      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await this.accountRepository.updatePassword(userId, hashedPassword);

    // Revoke all refresh tokens
    await this.accountRepository.revokeAllRefreshTokens(userId);

    // Log successful password change
    await this.accountRepository.createActivityLog(
      userId,
      'Changed account password',
      'security',
      metadata,
      true
    );

    logger.info(`User ${userId} changed password`);
  }

  /**
   * Get 2FA status for a user
   */
  async get2FAStatus(userId: string): Promise<TwoFactorStatusData> {
    const twoFactor = await this.accountRepository.findTwoFactorAuth(userId);

    return {
      enabled: twoFactor?.enabled || false,
      method: twoFactor?.method || 'totp',
    };
  }

  /**
   * Setup 2FA - Generate secret and QR code
   */
  async setup2FA(userId: string, username: string): Promise<TwoFactorSetupData> {
    // Generate secret
    const { secret, otpauth_url } = this.twoFactorService.generate2FASecret(username);
    const qrCode = await this.twoFactorService.generateQRCode(otpauth_url);

    // Generate backup codes
    const backupCodes = this.twoFactorService.generateBackupCodes(5);

    // Save to database (not enabled yet)
    await this.accountRepository.upsertTwoFactorAuth(userId, {
      enabled: false,
      secret,
      backupCodes,
    });

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Enable 2FA after verifying token
   */
  async enable2FA(
    userId: string,
    dto: Enable2FADto,
    metadata: RequestMetadata
  ): Promise<void> {
    const { token } = dto;

    const twoFactor = await this.accountRepository.findTwoFactorAuth(userId);

    if (!twoFactor || !twoFactor.secret) {
      throw new ValidationError('Please setup 2FA first');
    }

    // Verify token
    const isValid = this.twoFactorService.verify2FAToken(token, twoFactor.secret);
    if (!isValid) {
      throw new AuthenticationError('Invalid 2FA token');
    }

    // Enable 2FA
    await this.accountRepository.updateTwoFactorAuthStatus(userId, true);

    // Log activity
    await this.accountRepository.createActivityLog(
      userId,
      'Enabled 2FA authentication',
      'security',
      metadata,
      true
    );

    logger.info(`User ${userId} enabled 2FA`);
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, metadata: RequestMetadata): Promise<void> {
    await this.accountRepository.updateTwoFactorAuthStatus(userId, false);

    // Log activity
    await this.accountRepository.createActivityLog(
      userId,
      'Disabled 2FA authentication',
      'security',
      metadata,
      true
    );

    logger.info(`User ${userId} disabled 2FA`);
  }

  /**
   * Get activity logs with pagination
   */
  async getActivityLogs(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ActivityLogData> {
    const skip = (page - 1) * limit;

    const [logs, total] = await this.accountRepository.getActivityLogs(userId, skip, limit);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get active sessions
   */
  async getSessions(userId: string): Promise<SessionData[]> {
    return this.accountRepository.getActiveSessions(userId);
  }

  /**
   * Revoke a session
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.accountRepository.revokeSession(userId, sessionId);
  }
}
