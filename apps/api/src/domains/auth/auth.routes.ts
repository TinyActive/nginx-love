import { Router } from 'express';
import { AuthController } from './auth.controller';
import {
  loginValidation,
  verify2FAValidation,
  refreshTokenValidation,
  firstLoginPasswordValidation,
} from './dto';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify 2FA code during login
 * @access  Public
 */
router.post('/verify-2fa', verify2FAValidation, authController.verify2FA);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshTokenValidation, authController.refreshAccessToken);

/**
 * @route   POST /api/auth/first-login/change-password
 * @desc    Change password on first login
 * @access  Public
 */
router.post('/first-login/change-password', firstLoginPasswordValidation, authController.changePasswordFirstLogin);

export default router;
