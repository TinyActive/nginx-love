import { Router, Request, Response } from 'express';
import { domainsController } from './domains.controller';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { body } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createDomainValidation = [
  body('name')
    .notEmpty()
    .withMessage('Domain name is required')
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/)
    .withMessage('Invalid domain name format'),
  body('upstreams')
    .isArray({ min: 1 })
    .withMessage('At least one upstream is required'),
  body('upstreams.*.host')
    .notEmpty()
    .withMessage('Upstream host is required'),
  body('upstreams.*.port')
    .isInt({ min: 1, max: 65535 })
    .withMessage('Upstream port must be between 1 and 65535'),
];

const updateDomainValidation = [
  body('name')
    .optional()
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/)
    .withMessage('Invalid domain name format'),
];

/**
 * @route   GET /api/domains
 * @desc    Get all domains
 * @access  Private (all roles)
 */
router.get('/', (req: AuthRequest, res: Response) => domainsController.getDomains(req, res));

/**
 * @route   GET /api/domains/:id
 * @desc    Get domain by ID
 * @access  Private (all roles)
 */
router.get('/:id', (req: AuthRequest, res: Response) => domainsController.getDomainById(req, res));

/**
 * @route   POST /api/domains
 * @desc    Create new domain
 * @access  Private (admin, moderator)
 */
router.post(
  '/',
  authorize('admin', 'moderator'),
  createDomainValidation,
  (req: AuthRequest, res: Response) => domainsController.createDomain(req, res)
);

/**
 * @route   PUT /api/domains/:id
 * @desc    Update domain
 * @access  Private (admin, moderator)
 */
router.put(
  '/:id',
  authorize('admin', 'moderator'),
  updateDomainValidation,
  (req: AuthRequest, res: Response) => domainsController.updateDomain(req, res)
);

/**
 * @route   DELETE /api/domains/:id
 * @desc    Delete domain
 * @access  Private (admin only)
 */
router.delete('/:id', authorize('admin'), (req: AuthRequest, res: Response) =>
  domainsController.deleteDomain(req, res)
);

/**
 * @route   POST /api/domains/:id/toggle-ssl
 * @desc    Enable/Disable SSL for domain
 * @access  Private (admin, moderator)
 */
router.post('/:id/toggle-ssl', authorize('admin', 'moderator'), (req: AuthRequest, res: Response) =>
  domainsController.toggleSSL(req, res)
);

/**
 * @route   POST /api/domains/nginx/reload
 * @desc    Reload nginx configuration
 * @access  Private (admin only)
 */
router.post('/nginx/reload', authorize('admin'), (req: AuthRequest, res: Response) =>
  domainsController.reloadNginx(req, res)
);

export default router;
