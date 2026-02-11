/**
 * DNS Management Routes
 * API routes for DNS management (AdGuardHome + Cloudflare)
 */

import { Router } from 'express';
import {
  getAdGuardRewrites,
  addAdGuardRewrite,
  updateAdGuardRewrite,
  deleteAdGuardRewrite,
  getCloudflareRecords,
  createCloudflareRecord,
  updateCloudflareRecord,
  deleteCloudflareRecord,
  getAllDnsRecords,
  testDnsConnection,
} from './dns.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// AdGuardHome DNS rewrite routes
router.post('/adguard/rewrites', authenticate, getAdGuardRewrites);
router.post('/adguard/rewrites/add', authenticate, authorize('admin', 'moderator'), addAdGuardRewrite);
router.put('/adguard/rewrites', authenticate, authorize('admin', 'moderator'), updateAdGuardRewrite);
router.post('/adguard/rewrites/delete', authenticate, authorize('admin', 'moderator'), deleteAdGuardRewrite);

// Cloudflare DNS record routes
router.post('/cloudflare/records', authenticate, getCloudflareRecords);
router.post('/cloudflare/records/add', authenticate, authorize('admin', 'moderator'), createCloudflareRecord);
router.put('/cloudflare/records/:id', authenticate, authorize('admin', 'moderator'), updateCloudflareRecord);
router.post('/cloudflare/records/:id/delete', authenticate, authorize('admin', 'moderator'), deleteCloudflareRecord);

// Unified DNS routes
router.post('/records', authenticate, getAllDnsRecords);
router.post('/test-connection', authenticate, authorize('admin', 'moderator'), testDnsConnection);

export default router;
