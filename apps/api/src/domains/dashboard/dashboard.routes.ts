/**
 * Dashboard Routes
 * Express routes for dashboard endpoints
 */

import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// Get system metrics (CPU, Memory, Bandwidth, Requests)
router.get('/metrics', dashboardController.getSystemMetrics);

// Get recent alerts
router.get('/recent-alerts', dashboardController.getRecentAlerts);

export default router;
