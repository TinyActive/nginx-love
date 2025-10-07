/**
 * Alerts Routes
 * API routes for alert rules and notification channels
 */

import { Router } from 'express';
import {
  getNotificationChannels,
  getNotificationChannel,
  createNotificationChannel,
  updateNotificationChannel,
  deleteNotificationChannel,
  testNotificationChannel,
  getAlertRules,
  getAlertRule,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule
} from './alerts.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Notification Channels routes
router.get('/channels', authenticate, getNotificationChannels);
router.get('/channels/:id', authenticate, getNotificationChannel);
router.post('/channels', authenticate, authorize('admin', 'moderator'), createNotificationChannel);
router.put('/channels/:id', authenticate, authorize('admin', 'moderator'), updateNotificationChannel);
router.delete('/channels/:id', authenticate, authorize('admin', 'moderator'), deleteNotificationChannel);
router.post('/channels/:id/test', authenticate, authorize('admin', 'moderator'), testNotificationChannel);

// Alert Rules routes
router.get('/rules', authenticate, getAlertRules);
router.get('/rules/:id', authenticate, getAlertRule);
router.post('/rules', authenticate, authorize('admin', 'moderator'), createAlertRule);
router.put('/rules/:id', authenticate, authorize('admin', 'moderator'), updateAlertRule);
router.delete('/rules/:id', authenticate, authorize('admin', 'moderator'), deleteAlertRule);

export default router;
