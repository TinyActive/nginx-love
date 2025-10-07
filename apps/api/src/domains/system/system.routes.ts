import { Router } from 'express';
import * as systemController from './system.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get installation status
router.get('/installation-status', systemController.getInstallationStatus);

// Get nginx status
router.get('/nginx-status', systemController.getNginxStatus);

// Start installation (admin only)
router.post('/start-installation', authorize('admin'), systemController.startInstallation);

// Get system metrics
router.get('/metrics', systemController.getSystemMetrics);

// Manually trigger alert check (admin only)
router.post('/alerts/trigger-check', authorize('admin'), systemController.triggerAlertCheck);

export default router;
