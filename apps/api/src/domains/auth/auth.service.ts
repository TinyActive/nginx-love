import { comparePassword, hashPassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, generateTempToken, verifyTempToken } from '../../utils/jwt';
import { verify2FAToken } from '../../utils/twoFactor';
import logger from '../../utils/logger';
import { AuthRepository } from './auth.repository';
import {
  LoginDto,
  RefreshTokenDto,
  Verify2FADto,
  LogoutDto,
  FirstLoginPasswordDto,
} from './dto';
import {
  LoginResponse,
  LoginResult,
  Login2FARequiredResult,
  LoginFirstTimeResult,
  RefreshTokenResult,
  RequestMetadata,
  TokenPayload,
  UserData,
} from './auth.types';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
} from '../../shared/errors/app-error';

/**
 * Auth service - Contains all authentication business logic
 */
export class AuthService {
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;
  private readonly SESSION_EXPIRY_DAYS = 7;

  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Login user with username and password
   */
  async login(
    dto: LoginDto,
    metadata: RequestMetadata
  ): Promise<LoginResponse> {
    const { username, password } = dto;

    // Find user
    const user = await this.authRepository.findUserByUsername(username);

    if (!user) {
      // Log failed attempt without user ID (user doesn't exist)
      await this.authRepository.createActivityLog(
        null,
        `Failed login attempt for username: ${username}`,
        'security',
        metadata,
        false,
        'Invalid username'
      );

      throw new AuthenticationError('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AuthorizationError('Account is inactive or suspended');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      // Log failed attempt
      await this.authRepository.createActivityLog(
        user.id,
        'Failed login attempt',
        'security',
        metadata,
        false,
        'Invalid password'
      );

      throw new AuthenticationError('Invalid credentials');
    }

    // Check if this is first login
    if (user.isFirstLogin) {
      logger.info(`User ${username} is logging in for the first time`);

      const userData = this.mapUserData(user);
      const tempToken = generateTempToken(user.id);
      
      const result: LoginFirstTimeResult = {
        requirePasswordChange: true,
        userId: user.id,
        tempToken,
        user: userData,
      };

      return result;
    }

    // Check if 2FA is enabled
    if (user.twoFactor?.enabled) {
      logger.info(`User ${username} requires 2FA verification`);

      const userData = this.mapUserData(user);
      const result: Login2FARequiredResult = {
        requires2FA: true,
        userId: user.id,
        user: userData,
      };

      return result;
    }

    // Generate tokens and complete login
    return this.completeLogin(user, metadata);
  }

  /**
   * Verify 2FA token and complete login
   */
  async verify2FA(
    dto: Verify2FADto,
    metadata: RequestMetadata
  ): Promise<LoginResult> {
    const { userId, token } = dto;

    // Find user
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if 2FA is enabled
    if (!user.twoFactor || !user.twoFactor.enabled || !user.twoFactor.secret) {
      throw new ValidationError('2FA is not enabled for this account');
    }

    // Verify token
    const isValid = verify2FAToken(token, user.twoFactor.secret);

    if (!isValid) {
      // Log failed attempt
      await this.authRepository.createActivityLog(
        user.id,
        'Failed 2FA verification',
        'security',
        metadata,
        false,
        'Invalid 2FA token'
      );

      throw new AuthenticationError('Invalid 2FA token');
    }

    // Complete login with 2FA
    logger.info(`User ${user.username} logged in successfully with 2FA`);
    return this.completeLogin(user, metadata, true);
  }

  /**
   * Logout user
   */
  async logout(
    dto: LogoutDto,
    userId: string | undefined,
    metadata: RequestMetadata
  ): Promise<void> {
    const { refreshToken } = dto;

    // Revoke refresh token if provided
    if (refreshToken) {
      await this.authRepository.revokeRefreshToken(refreshToken);
    }

    // Log logout
    if (userId) {
      await this.authRepository.createActivityLog(
        userId,
        'User logged out',
        'logout',
        metadata,
        true
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(dto: RefreshTokenDto): Promise<RefreshTokenResult> {
    const { refreshToken } = dto;

    // Verify refresh token exists
    const tokenRecord = await this.authRepository.findRefreshToken(refreshToken);

    if (!tokenRecord) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Check if token is valid
    if (!this.authRepository.isRefreshTokenValid(tokenRecord)) {
      if (tokenRecord.revokedAt) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw new AuthenticationError('Refresh token expired');
    }

    // Generate new tokens (rotate refresh token for better security)
    const tokenPayload = this.createTokenPayload(tokenRecord.user);
    const accessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Revoke old refresh token
    await this.authRepository.revokeRefreshToken(refreshToken);

    // Save new refresh token
    const expiresAt = new Date(
      Date.now() + this.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );
    await this.authRepository.saveRefreshToken(tokenRecord.user.id, newRefreshToken, expiresAt);

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Change password on first login
   */
  async changePasswordFirstLogin(
    dto: FirstLoginPasswordDto,
    metadata: RequestMetadata
  ): Promise<LoginResult> {
    const { userId, tempToken, newPassword } = dto;

    // Verify temp token
    try {
      const payload = verifyTempToken(tempToken);
      if (payload.userId !== userId) {
        throw new AuthenticationError('Invalid token');
      }
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Find user
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user is still in first login state
    if (!user.isFirstLogin) {
      throw new ValidationError('Password has already been changed');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and set isFirstLogin to false
    await this.authRepository.updateUserPassword(userId, hashedPassword);
    await this.authRepository.updateUserFirstLoginStatus(userId, false);

    // Log activity
    await this.authRepository.createActivityLog(
      userId,
      'Changed password on first login',
      'security',
      metadata,
      true
    );

    logger.info(`User ${user.username} changed password on first login`);

    // Generate tokens and complete login (no need to login again)
    const result = await this.completeLogin(user, metadata, false);
    
    // Add flag to indicate if 2FA setup is needed
    return {
      ...result,
      require2FASetup: !user.twoFactor?.enabled,
    };
  }

  /**
   * Complete login process (generate tokens, update user, create session, log activity)
   */
  private async completeLogin(
    user: UserData & { id: string; username: string },
    metadata: RequestMetadata,
    is2FA: boolean = false
  ): Promise<LoginResult> {
    // Generate tokens
    const tokenPayload = this.createTokenPayload(user);
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    const expiresAt = new Date(
      Date.now() + this.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );
    await this.authRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

    // Update last login
    await this.authRepository.updateLastLogin(user.id);

    // Log successful login
    const action = is2FA ? 'User logged in with 2FA' : 'User logged in';
    await this.authRepository.createActivityLog(
      user.id,
      action,
      'login',
      metadata,
      true
    );

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const sessionExpiresAt = new Date(
      Date.now() + this.SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );
    await this.authRepository.createUserSession(
      user.id,
      sessionId,
      metadata,
      sessionExpiresAt
    );

    logger.info(`User ${user.username} logged in successfully${is2FA ? ' with 2FA' : ''}`);

    // Return user data and tokens
    const userData = this.mapUserData(user);
    return {
      user: userData,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Create token payload from user
   */
  private createTokenPayload(user: {
    id: string;
    username: string;
    email: string;
    role: string;
  }): TokenPayload {
    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Map user entity to UserData type
   */
  private mapUserData(user: {
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
  }): UserData {
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
      lastLogin: user.lastLogin,
    };
  }
}
