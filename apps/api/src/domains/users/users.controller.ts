import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { usersService } from './users.service';
import { parseUserQueryDto } from './dto/user-query.dto';
import { validateCreateUserDto } from './dto/create-user.dto';
import { validateUpdateUserDto, validateUpdateUserStatusDto } from './dto/update-user.dto';
import logger from '../../utils/logger';

/**
 * Users controller - handles HTTP requests for user management
 */
export class UsersController {
  /**
   * Get all users
   * GET /api/users
   * Permission: Admin, Moderator (read-only)
   */
  async listUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = parseUserQueryDto(req.query);
      const users = await usersService.getAllUsers(filters);

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      logger.error('List users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get single user by ID
   * GET /api/users/:id
   * Permission: Admin, Moderator (read-only), or self
   */
  async getUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      const user = await usersService.getUserById(id, currentUser.userId, currentUser.role as any);

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      logger.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Create new user
   * POST /api/users
   * Permission: Admin only
   */
  async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validation = validateCreateUserDto(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: validation.errors[0],
          errors: validation.errors,
        });
        return;
      }

      const currentUser = req.user!;
      const user = await usersService.createUser(
        req.body,
        currentUser.userId,
        currentUser.username,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      logger.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   * Permission: Admin only, or self (limited fields)
   */
  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      const validation = validateUpdateUserDto(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: validation.errors[0],
          errors: validation.errors,
        });
        return;
      }

      const updatedUser = await usersService.updateUser(
        id,
        req.body,
        currentUser.userId,
        currentUser.username,
        currentUser.role as any,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.json({
        success: true,
        data: updatedUser,
        message: currentUser.userId === id ? 'Profile updated successfully' : 'User updated successfully',
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      logger.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   * Permission: Admin only
   */
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      await usersService.deleteUser(
        id,
        currentUser.userId,
        currentUser.username,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Toggle user status (active/inactive)
   * PATCH /api/users/:id/status
   * Permission: Admin only
   */
  async toggleUserStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      const validation = validateUpdateUserStatusDto(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: validation.errors[0],
          errors: validation.errors,
        });
        return;
      }

      const updatedUser = await usersService.updateUserStatus(
        id,
        req.body.status,
        currentUser.userId,
        currentUser.username,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.json({
        success: true,
        data: updatedUser,
        message: 'User status updated successfully',
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      logger.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Reset user password (send reset email or generate temporary password)
   * POST /api/users/:id/reset-password
   * Permission: Admin only
   */
  async resetUserPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      const tempPassword = await usersService.resetUserPassword(
        id,
        currentUser.userId,
        currentUser.username,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      // In production, send email with temp password
      // For now, return temp password in response (ONLY FOR DEVELOPMENT)
      res.json({
        success: true,
        message: 'Password reset successfully',
        data: {
          temporaryPassword: tempPassword,
          note: 'Send this password to user securely. In production, this would be sent via email.',
        },
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      logger.error('Reset user password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get user statistics
   * GET /api/users/stats
   * Permission: Admin, Moderator
   */
  async getUserStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await usersService.getUserStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

// Export singleton instance
export const usersController = new UsersController();
