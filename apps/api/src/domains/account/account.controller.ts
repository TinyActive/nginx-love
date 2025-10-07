import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../../middleware/auth';
import { AccountService } from './account.service';
import { AccountRepository } from './account.repository';
import { TwoFactorService } from './services/two-factor.service';
import logger from '../../utils/logger';
import {
  AppError,
  AuthenticationError,
  NotFoundError,
} from '../../shared/errors/app-error';

/**
 * Account controller - Handles HTTP requests for account management
 */
class AccountController {
  private readonly accountService: AccountService;

  constructor() {
    const accountRepository = new AccountRepository();
    const twoFactorService = new TwoFactorService();
    this.accountService = new AccountService(accountRepository, twoFactorService);
  }

  /**
   * Get user profile
   * GET /api/account/profile
   */
  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const profile = await this.accountService.getProfile(userId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      this.handleError(error, res, 'Get profile error');
    }
  };

  /**
   * Update user profile
   * PUT /api/account/profile
   */
  updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const metadata = {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      };

      const updatedProfile = await this.accountService.updateProfile(
        userId,
        req.body,
        metadata
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
      });
    } catch (error) {
      this.handleError(error, res, 'Update profile error');
    }
  };

  /**
   * Change password
   * POST /api/account/password
   */
  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const metadata = {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      };

      await this.accountService.changePassword(userId, req.body, metadata);

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      this.handleError(error, res, 'Change password error');
    }
  };

  /**
   * Get 2FA status
   * GET /api/account/2fa
   */
  get2FAStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const status = await this.accountService.get2FAStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      this.handleError(error, res, 'Get 2FA status error');
    }
  };

  /**
   * Setup 2FA - Generate secret and QR code
   * POST /api/account/2fa/setup
   */
  setup2FA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const username = req.user?.username;

      if (!userId || !username) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const setupData = await this.accountService.setup2FA(userId, username);

      res.json({
        success: true,
        message: '2FA setup initiated',
        data: setupData,
      });
    } catch (error) {
      this.handleError(error, res, 'Setup 2FA error');
    }
  };

  /**
   * Enable 2FA after verification
   * POST /api/account/2fa/enable
   */
  enable2FA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const metadata = {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      };

      await this.accountService.enable2FA(userId, req.body, metadata);

      res.json({
        success: true,
        message: '2FA enabled successfully',
      });
    } catch (error) {
      this.handleError(error, res, 'Enable 2FA error');
    }
  };

  /**
   * Disable 2FA
   * POST /api/account/2fa/disable
   */
  disable2FA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const metadata = {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      };

      await this.accountService.disable2FA(userId, metadata);

      res.json({
        success: true,
        message: '2FA disabled successfully',
      });
    } catch (error) {
      this.handleError(error, res, 'Disable 2FA error');
    }
  };

  /**
   * Get activity logs
   * GET /api/account/activity
   */
  getActivityLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { page = 1, limit = 20 } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const activityData = await this.accountService.getActivityLogs(
        userId,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: activityData,
      });
    } catch (error) {
      this.handleError(error, res, 'Get activity logs error');
    }
  };

  /**
   * Get active sessions
   * GET /api/account/sessions
   */
  getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const sessions = await this.accountService.getSessions(userId);

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      this.handleError(error, res, 'Get sessions error');
    }
  };

  /**
   * Revoke a session
   * DELETE /api/account/sessions/:sessionId
   */
  revokeSession = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      await this.accountService.revokeSession(userId, sessionId);

      res.json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error) {
      this.handleError(error, res, 'Revoke session error');
    }
  };

  /**
   * Centralized error handling
   */
  private handleError(error: unknown, res: Response, logMessage: string): void {
    logger.error(logMessage, error);

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

// Export a singleton instance
export const accountController = new AccountController();

// Export individual controller methods
export const {
  getProfile,
  updateProfile,
  changePassword,
  get2FAStatus,
  setup2FA,
  enable2FA,
  disable2FA,
  getActivityLogs,
  getSessions,
  revokeSession,
} = accountController;
