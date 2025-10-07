import express from 'express';
import { exportForSync, importFromMaster, getCurrentConfigHash } from './node-sync.controller';
import { authenticate } from '../../middleware/auth';
import { validateMasterApiKey } from './middleware/slave-auth.middleware';

const router = express.Router();

/**
 * Export config for slave node sync (requires slave API key)
 * GET /api/node-sync/export
 */
router.get('/export', validateMasterApiKey, exportForSync);

/**
 * Import config from master (requires user auth)
 * POST /api/node-sync/import
 */
router.post('/import', authenticate, importFromMaster);

/**
 * Get current config hash (requires user auth)
 * GET /api/node-sync/current-hash
 */
router.get('/current-hash', authenticate, getCurrentConfigHash);

export default router;
