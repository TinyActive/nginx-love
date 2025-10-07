import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getSSLCertificates,
  getSSLCertificate,
  issueAutoSSL,
  uploadManualSSL,
  updateSSLCertificate,
  deleteSSLCertificate,
  renewSSLCertificate,
} from './ssl.controller';

const router = express.Router();

// All SSL routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/ssl
 * @desc    Get all SSL certificates
 * @access  Private (all roles)
 */
router.get('/', getSSLCertificates);

/**
 * @route   GET /api/ssl/:id
 * @desc    Get single SSL certificate
 * @access  Private (all roles)
 */
router.get('/:id', getSSLCertificate);

/**
 * @route   POST /api/ssl/auto
 * @desc    Issue Let's Encrypt certificate (auto)
 * @access  Private (admin, moderator)
 */
router.post(
  '/auto',
  authorize('admin', 'moderator'),
  [
    body('domainId').notEmpty().withMessage('Domain ID is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('autoRenew').optional().isBoolean().withMessage('Auto renew must be boolean'),
  ],
  issueAutoSSL
);

/**
 * @route   POST /api/ssl/manual
 * @desc    Upload manual SSL certificate
 * @access  Private (admin, moderator)
 */
router.post(
  '/manual',
  authorize('admin', 'moderator'),
  [
    body('domainId').notEmpty().withMessage('Domain ID is required'),
    body('certificate').notEmpty().withMessage('Certificate is required'),
    body('privateKey').notEmpty().withMessage('Private key is required'),
    body('chain').optional().isString(),
    body('issuer').optional().isString(),
  ],
  uploadManualSSL
);

/**
 * @route   PUT /api/ssl/:id
 * @desc    Update SSL certificate
 * @access  Private (admin, moderator)
 */
router.put(
  '/:id',
  authorize('admin', 'moderator'),
  [
    body('certificate').optional().isString(),
    body('privateKey').optional().isString(),
    body('chain').optional().isString(),
    body('autoRenew').optional().isBoolean(),
  ],
  updateSSLCertificate
);

/**
 * @route   DELETE /api/ssl/:id
 * @desc    Delete SSL certificate
 * @access  Private (admin, moderator)
 */
router.delete('/:id', authorize('admin', 'moderator'), deleteSSLCertificate);

/**
 * @route   POST /api/ssl/:id/renew
 * @desc    Renew SSL certificate
 * @access  Private (admin, moderator)
 */
router.post('/:id/renew', authorize('admin', 'moderator'), renewSSLCertificate);

export default router;
