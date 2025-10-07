import { Router } from 'express';
import { AuthController } from './auth.controller';
import {
  loginValidation,
  verify2FAValidation,
  refreshTokenValidation,
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

export default router;
