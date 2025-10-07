import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { modSecController } from './modsec.controller';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

// CRS Rules (OWASP Core Rule Set)
router.get('/crs/rules', (req, res) => modSecController.getCRSRules(req, res));
router.patch('/crs/rules/:ruleFile/toggle', authorize('admin', 'moderator'), (req, res) =>
  modSecController.toggleCRSRule(req, res)
);

// Custom Rules
router.get('/rules', (req, res) => modSecController.getModSecRules(req, res));

// Get single rule
router.get('/rules/:id', (req, res) => modSecController.getModSecRule(req, res));

// Toggle rule enabled/disabled
router.patch('/rules/:id/toggle', authorize('admin', 'moderator'), (req, res) =>
  modSecController.toggleModSecRule(req, res)
);

// Add custom rule
router.post(
  '/rules',
  authorize('admin', 'moderator'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('ruleContent').notEmpty().withMessage('Rule content is required'),
    body('description').optional().isString(),
    body('domainId').optional().isString(),
    body('enabled').optional().isBoolean(),
  ],
  (req: AuthRequest, res: Response) => modSecController.addCustomRule(req, res)
);

// Update rule
router.put(
  '/rules/:id',
  authorize('admin', 'moderator'),
  [
    body('name').optional().isString(),
    body('category').optional().isString(),
    body('ruleContent').optional().isString(),
    body('description').optional().isString(),
    body('enabled').optional().isBoolean(),
  ],
  (req: AuthRequest, res: Response) => modSecController.updateModSecRule(req, res)
);

// Delete rule
router.delete('/rules/:id', authorize('admin', 'moderator'), (req, res) =>
  modSecController.deleteModSecRule(req, res)
);

// Get global ModSecurity settings
router.get('/global', (req, res) => modSecController.getGlobalModSecSettings(req, res));

// Set global ModSecurity enabled/disabled
router.post(
  '/global',
  authorize('admin', 'moderator'),
  [body('enabled').isBoolean().withMessage('Enabled must be a boolean')],
  (req: AuthRequest, res: Response) => modSecController.setGlobalModSec(req, res)
);

export default router;
