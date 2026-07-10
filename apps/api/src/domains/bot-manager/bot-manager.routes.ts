import { Router } from 'express';
import { botManagerController } from './bot-manager.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Preview & apply (before :id routes)
router.get('/preview', (req, res) => botManagerController.preview(req, res));
router.post('/apply', authorize('admin', 'moderator'), (req, res) => botManagerController.apply(req, res));

// Analytics & discovery
router.get('/analytics', (req, res) => botManagerController.getAnalytics(req, res));
router.get('/analytics/top-fingerprints', (req, res) => botManagerController.getAnalytics(req, res));
router.post('/fingerprints/discover', authorize('admin', 'moderator'), (req, res) => botManagerController.discover(req, res));
router.get('/fingerprints', (req, res) => botManagerController.getFingerprints(req, res));

// Global rules
router.get('/global-rules', (req, res) => botManagerController.getGlobalRules(req, res));
router.post('/global-rules', authorize('admin', 'moderator'), (req, res) => botManagerController.createGlobalRule(req, res));

// Rules by ID
router.put('/rules/:ruleId', authorize('admin', 'moderator'), (req, res) => botManagerController.updateRule(req, res));
router.delete('/rules/:ruleId', authorize('admin', 'moderator'), (req, res) => botManagerController.deleteRule(req, res));
router.patch('/rules/:ruleId/toggle', authorize('admin', 'moderator'), (req, res) => botManagerController.toggleRule(req, res));

// Domain assignments
router.get('/domains/:domainId', (req, res) => botManagerController.getByDomain(req, res));

// Profiles
router.get('/profiles', (req, res) => botManagerController.getProfiles(req, res));
router.post('/profiles', authorize('admin', 'moderator'), (req, res) => botManagerController.createProfile(req, res));
router.get('/profiles/:id', (req, res) => botManagerController.getProfile(req, res));
router.put('/profiles/:id', authorize('admin', 'moderator'), (req, res) => botManagerController.updateProfile(req, res));
router.delete('/profiles/:id', authorize('admin', 'moderator'), (req, res) => botManagerController.deleteProfile(req, res));
router.patch('/profiles/:id/toggle', authorize('admin', 'moderator'), (req, res) => botManagerController.toggleProfile(req, res));

// Profile rules & domain assignment
router.get('/profiles/:id/rules', (req, res) => botManagerController.getProfileRules(req, res));
router.post('/profiles/:id/rules', authorize('admin', 'moderator'), (req, res) => botManagerController.createProfileRule(req, res));
router.post('/profiles/:id/assign-domain', authorize('admin', 'moderator'), (req, res) => botManagerController.assignDomain(req, res));
router.delete('/profiles/:id/domains/:domainId', authorize('admin', 'moderator'), (req, res) => botManagerController.removeDomain(req, res));

export default router;
