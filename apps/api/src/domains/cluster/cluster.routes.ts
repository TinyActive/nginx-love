import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth';
import { validateSlaveApiKey } from './middleware/slave-auth.middleware';
import {
  registerSlaveNode,
  getSlaveNodes,
  getSlaveNode,
  deleteSlaveNode,
  healthCheck
} from './cluster.controller';

const router = Router();

/**
 * @route   POST /api/slave/nodes
 * @desc    Register new slave node
 * @access  Private (admin)
 */
router.post(
  '/nodes',
  authenticate,
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('host').notEmpty().withMessage('Host is required'),
    body('port').optional().isInt({ min: 1, max: 65535 }),
    body('syncInterval').optional().isInt({ min: 10 })
  ],
  registerSlaveNode
);

/**
 * @route   GET /api/slave/nodes
 * @desc    Get all slave nodes
 * @access  Private (all roles)
 */
router.get('/nodes', authenticate, getSlaveNodes);

/**
 * @route   GET /api/slave/nodes/:id
 * @desc    Get single slave node
 * @access  Private (all roles)
 */
router.get('/nodes/:id', authenticate, getSlaveNode);

/**
 * @route   DELETE /api/slave/nodes/:id
 * @desc    Delete slave node
 * @access  Private (admin)
 */
router.delete('/nodes/:id', authenticate, authorize('admin'), deleteSlaveNode);

/**
 * @route   GET /api/slave/health
 * @desc    Health check endpoint (called by master to verify slave is alive)
 * @access  Slave API Key
 */
router.get('/health', validateSlaveApiKey, healthCheck);

export default router;
