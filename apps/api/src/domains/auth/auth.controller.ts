import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { LoginDto, LogoutDto, RefreshTokenDto, Verify2FADto } from './dto';
import { RequestMetadata } from './auth.types';
import logger from '../../utils/logger';
import { AppError } from '../../shared/errors/app-error';

/**
 * Auth controller - Thin layer handling HTTP requests/responses
 */
export class AuthController {
  private readonly authService: AuthService;

  constructor() {
    const authRepository = new AuthRepository();
    this.authService = new AuthService(authRepository);
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const dto: LoginDto = req.body;

      // Extract request metadata
      const metadata: RequestMetadata = {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      };

      // Call service
      const result = await this.authService.login(dto, metadata);

      // Check if 2FA is required
      if ('requires2FA' in result) {
        res.json({
          success: true,
          message: '2FA verification required',
          data: {
            requires2FA: result.requires2FA,
            userId: result.userId,
            user: result.user,
          },
        });
        return;
      }

      // Return successful login response
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Verify 2FA token during login
   * POST /api/auth/verify-2fa
   */
  verify2FA = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const dto: Verify2FADto = req.body;

      // Extract request metadata
      const metadata: RequestMetadata = {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      };

      // Call service
      const result = await this.authService.verify2FA(dto, metadata);

      // Return successful login response
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: LogoutDto = req.body;

      // Extract user ID from request (if authenticated)
      const userId = (req as any).user?.userId;

      // Extract request metadata
      const metadata: RequestMetadata = {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      };

      // Call service
      await this.authService.logout(dto, userId, metadata);

      // Return success response
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const dto: RefreshTokenDto = req.body;

      // Call service
      const result = await this.authService.refreshAccessToken(dto);

      // Return success response
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Handle errors and send appropriate HTTP responses
   */
  private handleError(error: unknown, res: Response): void {
    // Handle AppError instances
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Handle unexpected errors
    logger.error('Unexpected error in AuthController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
