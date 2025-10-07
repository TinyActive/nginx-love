import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getLogs, getLogStatistics, downloadLogs, getAvailableDomains } from './logs.controller';

const router = Router();

/**
 * @route   GET /api/logs
 * @desc    Get logs with filters
 * @access  Private
 */
router.get('/', authenticate, getLogs);

/**
 * @route   GET /api/logs/stats
 * @desc    Get log statistics
 * @access  Private
 */
router.get('/stats', authenticate, getLogStatistics);

/**
 * @route   GET /api/logs/domains
 * @desc    Get list of available domains
 * @access  Private
 */
router.get('/domains', authenticate, getAvailableDomains);

/**
 * @route   GET /api/logs/download
 * @desc    Download logs as JSON
 * @access  Private
 */
router.get('/download', authenticate, downloadLogs);

export default router;
