import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
} from '../../../shared/errors/app-error';
import * as passwordUtil from '../../../utils/password';
import * as jwtUtil from '../../../utils/jwt';
import * as twoFactorUtil from '../../../utils/twoFactor';

// Mock dependencies
vi.mock('../../../utils/password');
vi.mock('../../../utils/jwt');
vi.mock('../../../utils/twoFactor');
vi.mock('../../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: AuthRepository;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    fullName: 'Test User',
    role: 'admin' as const,
    status: 'active' as const,
    avatar: null,
    phone: null,
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'en',
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    twoFactor: null,
  };

  const mockMetadata = {
    ip: '127.0.0.1',
    userAgent: 'test-agent',
  };

  beforeEach(() => {
    authRepository = new AuthRepository();
    authService = new AuthService(authRepository);

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login user without 2FA', async () => {
      // Arrange
      const loginDto = { username: 'testuser', password: 'password123' };
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';

      vi.spyOn(authRepository, 'findUserByUsername').mockResolvedValue(mockUser);
      vi.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(true);
      vi.spyOn(jwtUtil, 'generateAccessToken').mockReturnValue(mockAccessToken);
      vi.spyOn(jwtUtil, 'generateRefreshToken').mockReturnValue(mockRefreshToken);
      vi.spyOn(authRepository, 'saveRefreshToken').mockResolvedValue(undefined);
      vi.spyOn(authRepository, 'updateLastLogin').mockResolvedValue(undefined);
      vi.spyOn(authRepository, 'createActivityLog').mockResolvedValue(undefined);
      vi.spyOn(authRepository, 'createUserSession').mockResolvedValue(undefined);

      // Act
      const result = await authService.login(loginDto, mockMetadata);

      // Assert
      expect(result).toHaveProperty('accessToken', mockAccessToken);
      expect(result).toHaveProperty('refreshToken', mockRefreshToken);
      expect(result).toHaveProperty('user');
      expect((result as any).user.username).toBe('testuser');
      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        mockUser.id,
        'User logged in',
        'login',
        mockMetadata,
        true
      );
    });

    it('should return 2FA required when user has 2FA enabled', async () => {
      // Arrange
      const loginDto = { username: 'testuser', password: 'password123' };
      const userWith2FA = {
        ...mockUser,
        twoFactor: {
          id: '2fa-123',
          userId: mockUser.id,
          enabled: true,
          method: 'totp',
          secret: 'secret-key',
          backupCodes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.spyOn(authRepository, 'findUserByUsername').mockResolvedValue(userWith2FA);
      vi.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(true);

      // Act
      const result = await authService.login(loginDto, mockMetadata);

      // Assert
      expect(result).toHaveProperty('requires2FA', true);
      expect(result).toHaveProperty('userId', mockUser.id);
      expect(result).toHaveProperty('user');
    });

    it('should throw AuthenticationError for invalid username', async () => {
      // Arrange
      const loginDto = { username: 'nonexistent', password: 'password123' };

      vi.spyOn(authRepository, 'findUserByUsername').mockResolvedValue(null);
      vi.spyOn(authRepository, 'createActivityLog').mockResolvedValue(undefined);

      // Act & Assert
      await expect(authService.login(loginDto, mockMetadata)).rejects.toThrow(
        AuthenticationError
      );
      await expect(authService.login(loginDto, mockMetadata)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw AuthenticationError for invalid password', async () => {
      // Arrange
      const loginDto = { username: 'testuser', password: 'wrongpassword' };

      vi.spyOn(authRepository, 'findUserByUsername').mockResolvedValue(mockUser);
      vi.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(false);
      vi.spyOn(authRepository, 'createActivityLog').mockResolvedValue(undefined);

      // Act & Assert
      await expect(authService.login(loginDto, mockMetadata)).rejects.toThrow(
        AuthenticationError
      );
    });

    it('should throw AuthorizationError for inactive user', async () => {
      // Arrange
      const loginDto = { username: 'testuser', password: 'password123' };
      const inactiveUser = { ...mockUser, status: 'inactive' as const };

      vi.spyOn(authRepository, 'findUserByUsername').mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.login(loginDto, mockMetadata)).rejects.toThrow(
        AuthorizationError
      );
      await expect(authService.login(loginDto, mockMetadata)).rejects.toThrow(
        'Account is inactive or suspended'
      );
    });
  });

  describe('verify2FA', () => {
    it('should successfully verify 2FA and complete login', async () => {
      // Arrange
      const verify2FADto = { userId: 'user-123', token: '123456' };
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';
      const userWith2FA = {
        ...mockUser,
        twoFactor: {
          id: '2fa-123',
          userId: mockUser.id,
          enabled: true,
          method: 'totp',
          secret: 'secret-key',
          backupCodes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.spyOn(authRepository, 'findUserById').mockResolvedValue(userWith2FA);
      vi.spyOn(twoFactorUtil, 'verify2FAToken').mockReturnValue(true);
      vi.spyOn(jwtUtil, 'generateAccessToken').mockReturnValue(mockAccessToken);
      vi.spyOn(jwtUtil, 'generateRefreshToken').mockReturnValue(mockRefreshToken);
      vi.spyOn(authRepository, 'saveRefreshToken').mockResolvedValue(undefined);
      vi.spyOn(authRepository, 'updateLastLogin').mockResolvedValue(undefined);
      vi.spyOn(authRepository, 'createActivityLog').mockResolvedValue(undefined);
      vi.spyOn(authRepository, 'createUserSession').mockResolvedValue(undefined);

      // Act
      const result = await authService.verify2FA(verify2FADto, mockMetadata);

      // Assert
      expect(result).toHaveProperty('accessToken', mockAccessToken);
      expect(result).toHaveProperty('refreshToken', mockRefreshToken);
      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        mockUser.id,
        'User logged in with 2FA',
        'login',
        mockMetadata,
        true
      );
    });

    it('should throw NotFoundError for invalid user ID', async () => {
      // Arrange
      const verify2FADto = { userId: 'invalid-user', token: '123456' };

      vi.spyOn(authRepository, 'findUserById').mockResolvedValue(null);

      // Act & Assert
      await expect(authService.verify2FA(verify2FADto, mockMetadata)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ValidationError if 2FA is not enabled', async () => {
      // Arrange
      const verify2FADto = { userId: 'user-123', token: '123456' };

      vi.spyOn(authRepository, 'findUserById').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.verify2FA(verify2FADto, mockMetadata)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw AuthenticationError for invalid 2FA token', async () => {
      // Arrange
      const verify2FADto = { userId: 'user-123', token: '123456' };
      const userWith2FA = {
        ...mockUser,
        twoFactor: {
          id: '2fa-123',
          userId: mockUser.id,
          enabled: true,
          method: 'totp',
          secret: 'secret-key',
          backupCodes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.spyOn(authRepository, 'findUserById').mockResolvedValue(userWith2FA);
      vi.spyOn(twoFactorUtil, 'verify2FAToken').mockReturnValue(false);
      vi.spyOn(authRepository, 'createActivityLog').mockResolvedValue(undefined);

      // Act & Assert
      await expect(authService.verify2FA(verify2FADto, mockMetadata)).rejects.toThrow(
        AuthenticationError
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout user with refresh token', async () => {
      // Arrange
      const logoutDto = { refreshToken: 'refresh-token' };
      const userId = 'user-123';

      vi.spyOn(authRepository, 'revokeRefreshToken').mockResolvedValue(undefined);
      vi.spyOn(authRepository, 'createActivityLog').mockResolvedValue(undefined);

      // Act
      await authService.logout(logoutDto, userId, mockMetadata);

      // Assert
      expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        userId,
        'User logged out',
        'logout',
        mockMetadata,
        true
      );
    });

    it('should logout without refresh token', async () => {
      // Arrange
      const logoutDto = {};
      const userId = 'user-123';

      vi.spyOn(authRepository, 'revokeRefreshToken').mockResolvedValue(undefined);
      vi.spyOn(authRepository, 'createActivityLog').mockResolvedValue(undefined);

      // Act
      await authService.logout(logoutDto, userId, mockMetadata);

      // Assert
      expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled();
      expect(authRepository.createActivityLog).toHaveBeenCalled();
    });

    it('should logout without user ID', async () => {
      // Arrange
      const logoutDto = { refreshToken: 'refresh-token' };

      vi.spyOn(authRepository, 'revokeRefreshToken').mockResolvedValue(undefined);
      vi.spyOn(authRepository, 'createActivityLog').mockResolvedValue(undefined);

      // Act
      await authService.logout(logoutDto, undefined, mockMetadata);

      // Assert
      expect(authRepository.revokeRefreshToken).toHaveBeenCalled();
      expect(authRepository.createActivityLog).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh access token', async () => {
      // Arrange
      const refreshDto = { refreshToken: 'valid-refresh-token' };
      const mockAccessToken = 'new-access-token';
      const mockTokenRecord = {
        id: 'token-123',
        userId: mockUser.id,
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
        createdAt: new Date(),
        revokedAt: null,
        user: mockUser,
      };

      vi.spyOn(authRepository, 'findRefreshToken').mockResolvedValue(mockTokenRecord);
      vi.spyOn(authRepository, 'isRefreshTokenValid').mockReturnValue(true);
      vi.spyOn(jwtUtil, 'generateAccessToken').mockReturnValue(mockAccessToken);

      // Act
      const result = await authService.refreshAccessToken(refreshDto);

      // Assert
      expect(result).toEqual({ accessToken: mockAccessToken });
    });

    it('should throw AuthenticationError for non-existent token', async () => {
      // Arrange
      const refreshDto = { refreshToken: 'invalid-token' };

      vi.spyOn(authRepository, 'findRefreshToken').mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshAccessToken(refreshDto)).rejects.toThrow(
        AuthenticationError
      );
      await expect(authService.refreshAccessToken(refreshDto)).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw AuthenticationError for revoked token', async () => {
      // Arrange
      const refreshDto = { refreshToken: 'revoked-token' };
      const mockTokenRecord = {
        id: 'token-123',
        userId: mockUser.id,
        token: 'revoked-token',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        revokedAt: new Date(),
        user: mockUser,
      };

      vi.spyOn(authRepository, 'findRefreshToken').mockResolvedValue(mockTokenRecord);
      vi.spyOn(authRepository, 'isRefreshTokenValid').mockReturnValue(false);

      // Act & Assert
      await expect(authService.refreshAccessToken(refreshDto)).rejects.toThrow(
        AuthenticationError
      );
    });

    it('should throw AuthenticationError for expired token', async () => {
      // Arrange
      const refreshDto = { refreshToken: 'expired-token' };
      const mockTokenRecord = {
        id: 'token-123',
        userId: mockUser.id,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
        createdAt: new Date(),
        revokedAt: null,
        user: mockUser,
      };

      vi.spyOn(authRepository, 'findRefreshToken').mockResolvedValue(mockTokenRecord);
      vi.spyOn(authRepository, 'isRefreshTokenValid').mockReturnValue(false);

      // Act & Assert
      await expect(authService.refreshAccessToken(refreshDto)).rejects.toThrow(
        AuthenticationError
      );
      await expect(authService.refreshAccessToken(refreshDto)).rejects.toThrow(
        'Refresh token expired'
      );
    });
  });
});
