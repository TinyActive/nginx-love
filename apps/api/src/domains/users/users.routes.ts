import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { usersController } from './users.controller';

const router = Router();

/**
 * User Management Routes
 * All routes require authentication
 * Permissions are specified for each route
 */

// Get user statistics
// Permission: Admin, Moderator
router.get(
  '/stats',
  authenticate,
  authorize('admin', 'moderator'),
  (req, res) => usersController.getUserStats(req, res)
);

// List all users
// Permission: Admin, Moderator (read-only)
router.get(
  '/',
  authenticate,
  authorize('admin', 'moderator'),
  (req, res) => usersController.listUsers(req, res)
);

// Get single user
// Permission: Admin, Moderator, or self
router.get(
  '/:id',
  authenticate,
  (req, res) => usersController.getUser(req, res)
);

// Create new user
// Permission: Admin only
router.post(
  '/',
  authenticate,
  authorize('admin'),
  (req, res) => usersController.createUser(req, res)
);

// Update user
// Permission: Admin (full update), or self (limited fields)
router.put(
  '/:id',
  authenticate,
  (req, res) => usersController.updateUser(req, res)
);

// Delete user
// Permission: Admin only
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  (req, res) => usersController.deleteUser(req, res)
);

// Toggle user status
// Permission: Admin only
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  (req, res) => usersController.toggleUserStatus(req, res)
);

// Reset user password
// Permission: Admin only
router.post(
  '/:id/reset-password',
  authenticate,
  authorize('admin'),
  (req, res) => usersController.resetUserPassword(req, res)
);

export default router;
