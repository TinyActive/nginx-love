import { Router } from 'express';
import { aclController } from './acl.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/acl
 * @desc    Get all ACL rules
 * @access  Private (all roles)
 */
router.get('/', (req, res) => aclController.getAclRules(req, res));

/**
 * @route   GET /api/acl/:id
 * @desc    Get single ACL rule
 * @access  Private (all roles)
 */
router.get('/:id', (req, res) => aclController.getAclRule(req, res));

/**
 * @route   POST /api/acl
 * @desc    Create new ACL rule
 * @access  Private (admin, moderator)
 */
router.post('/', authorize('admin', 'moderator'), (req, res) => aclController.createAclRule(req, res));

/**
 * @route   POST /api/acl/apply
 * @desc    Apply ACL rules to Nginx
 * @access  Private (admin, moderator)
 */
router.post('/apply', authorize('admin', 'moderator'), (req, res) => aclController.applyAclToNginx(req, res));

/**
 * @route   PUT /api/acl/:id
 * @desc    Update ACL rule
 * @access  Private (admin, moderator)
 */
router.put('/:id', authorize('admin', 'moderator'), (req, res) => aclController.updateAclRule(req, res));

/**
 * @route   DELETE /api/acl/:id
 * @desc    Delete ACL rule
 * @access  Private (admin, moderator)
 */
router.delete('/:id', authorize('admin', 'moderator'), (req, res) => aclController.deleteAclRule(req, res));

/**
 * @route   PATCH /api/acl/:id/toggle
 * @desc    Toggle ACL rule enabled status
 * @access  Private (admin, moderator)
 */
router.patch('/:id/toggle', authorize('admin', 'moderator'), (req, res) => aclController.toggleAclRule(req, res));

export default router;
