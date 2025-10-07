import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import {
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
} from './account.controller';
import { authenticate } from '../../middleware/auth';
import {
  updateProfileValidation,
  changePasswordValidation,
  enable2FAValidation,
} from './account.validation';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/account/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/account/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', updateProfileValidation, updateProfile);

/**
 * @route   POST /api/account/password
 * @desc    Change password
 * @access  Private
 */
router.post('/password', changePasswordValidation, changePassword);

/**
 * @route   GET /api/account/2fa
 * @desc    Get 2FA status
 * @access  Private
 */
router.get('/2fa', get2FAStatus);

/**
 * @route   POST /api/account/2fa/setup
 * @desc    Setup 2FA
 * @access  Private
 */
router.post('/2fa/setup', setup2FA);

/**
 * @route   POST /api/account/2fa/enable
 * @desc    Enable 2FA
 * @access  Private
 */
router.post('/2fa/enable', enable2FAValidation, enable2FA);

/**
 * @route   POST /api/account/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/2fa/disable', disable2FA);

/**
 * @route   GET /api/account/activity
 * @desc    Get activity logs
 * @access  Private
 */
router.get('/activity', getActivityLogs);

/**
 * @route   GET /api/account/sessions
 * @desc    Get active sessions
 * @access  Private
 */
router.get('/sessions', getSessions);

/**
 * @route   DELETE /api/account/sessions/:sessionId
 * @desc    Revoke a session
 * @access  Private
 */
router.delete('/sessions/:sessionId', revokeSession);

export default router;
