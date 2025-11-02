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

// Dashboard Analytics Endpoints
// Get request trend (auto-refresh every 5s)
router.get('/analytics/request-trend', dashboardController.getRequestTrend);

// Get slow requests
router.get('/analytics/slow-requests', dashboardController.getSlowRequests);

// Get latest attack statistics (top 5 in 24h)
router.get('/analytics/latest-attacks', dashboardController.getLatestAttackStats);

// Get latest security news/events
router.get('/analytics/latest-news', dashboardController.getLatestNews);

// Get request analytics (top IPs by period)
router.get('/analytics/request-analytics', dashboardController.getRequestAnalytics);

// Get attack vs normal request ratio
router.get('/analytics/attack-ratio', dashboardController.getAttackRatio);

// Get complete dashboard analytics (all in one)
router.get('/analytics', dashboardController.getDashboardAnalytics);

export default router;
