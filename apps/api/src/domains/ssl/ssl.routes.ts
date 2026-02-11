import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getSSLCertificates,
  getSSLCertificate,
  getSSLSystemInfo,
  issueAutoSSL,
  uploadManualSSL,
  updateSSLCertificate,
  deleteSSLCertificate,
  renewSSLCertificate,
  issueWildcardSSL,
  uploadWildcardSSL,
  applyWildcardSSL,
  validateWildcardSSL,
  getWildcardCertificates,
} from './ssl.controller';

const router = express.Router();

// All SSL routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/ssl/system-info
 * @desc    Get SSL system information (CA server, etc.)
 * @access  Private (all roles)
 */
router.get('/system-info', getSSLSystemInfo);

/**
 * @route   GET /api/ssl/wildcard
 * @desc    Get all wildcard SSL certificates
 * @access  Private (all roles)
 */
router.get('/wildcard', getWildcardCertificates);

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
 * @desc    Issue ZeroSSL/Let's Encrypt certificate (auto)
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
 * @route   POST /api/ssl/wildcard/auto
 * @desc    Issue wildcard SSL certificate via ACME DNS-01 challenge
 * @access  Private (admin, moderator)
 */
router.post(
  '/wildcard/auto',
  authorize('admin', 'moderator'),
  [
    body('domainId').notEmpty().withMessage('Domain ID is required'),
    body('baseDomain').notEmpty().withMessage('Base domain is required (e.g., example.com)'),
    body('dnsProvider').notEmpty().withMessage('DNS provider is required for wildcard certificates'),
    body('dnsCredentials').optional().isObject().withMessage('DNS credentials must be an object'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('autoRenew').optional().isBoolean().withMessage('Auto renew must be boolean'),
  ],
  issueWildcardSSL
);

/**
 * @route   POST /api/ssl/wildcard/manual
 * @desc    Upload manual wildcard SSL certificate
 * @access  Private (admin, moderator)
 */
router.post(
  '/wildcard/manual',
  authorize('admin', 'moderator'),
  [
    body('domainId').notEmpty().withMessage('Domain ID is required'),
    body('certificate').notEmpty().withMessage('Certificate is required'),
    body('privateKey').notEmpty().withMessage('Private key is required'),
    body('chain').optional().isString(),
    body('issuer').optional().isString(),
    body('additionalDomainIds').optional().isArray().withMessage('Additional domain IDs must be an array'),
  ],
  uploadWildcardSSL
);

/**
 * @route   POST /api/ssl/wildcard/apply
 * @desc    Apply wildcard SSL certificate to additional domains
 * @access  Private (admin, moderator)
 */
router.post(
  '/wildcard/apply',
  authorize('admin', 'moderator'),
  [
    body('certificateId').notEmpty().withMessage('Certificate ID is required'),
    body('targetDomainIds').isArray({ min: 1 }).withMessage('At least one target domain ID is required'),
  ],
  applyWildcardSSL
);

/**
 * @route   POST /api/ssl/wildcard/validate
 * @desc    Validate wildcard SSL certificate against domains
 * @access  Private (admin, moderator)
 */
router.post(
  '/wildcard/validate',
  authorize('admin', 'moderator'),
  [
    body('certificate').notEmpty().withMessage('Certificate is required'),
    body('domainNames').isArray({ min: 1 }).withMessage('At least one domain name is required'),
  ],
  validateWildcardSSL
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
