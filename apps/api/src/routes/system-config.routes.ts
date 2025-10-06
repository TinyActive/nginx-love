import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSystemConfig,
  updateNodeMode,
  connectToMaster,
  disconnectFromMaster,
  testMasterConnection
} from '../controllers/system-config.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// System configuration routes
router.get('/', getSystemConfig);
router.put('/node-mode', updateNodeMode);

// Slave mode routes
router.post('/connect-master', connectToMaster);
router.post('/disconnect-master', disconnectFromMaster);
router.post('/test-master-connection', testMasterConnection);

export default router;
