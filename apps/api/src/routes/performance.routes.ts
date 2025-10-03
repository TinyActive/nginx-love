import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getPerformanceMetrics,
  getPerformanceStats,
  getPerformanceHistory,
  cleanupOldMetrics
} from '../controllers/performance.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get performance metrics with filtering
router.get('/metrics', getPerformanceMetrics);

// Get aggregated performance stats
router.get('/stats', getPerformanceStats);

// Get historical metrics from database
router.get('/history', getPerformanceHistory);

// Cleanup old metrics (admin only)
router.delete('/cleanup', authorize('admin'), cleanupOldMetrics);

export default router;
