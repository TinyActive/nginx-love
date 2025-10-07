import { Router } from 'express';
import authRoutes from '../domains/auth/auth.routes';
import accountRoutes from '../domains/account/account.routes';
import domainRoutes from '../domains/domains/domains.routes';
import systemRoutes from '../domains/system/system.routes';
import systemConfigRoutes from '../domains/system/system-config.routes';
import sslRoutes from '../domains/ssl/ssl.routes';
import modsecRoutes from '../domains/modsec/modsec.routes';
import logsRoutes from '../domains/logs/logs.routes';
import alertsRoutes from '../domains/alerts/alerts.routes';
import aclRoutes from '../domains/acl/acl.routes';
import performanceRoutes from '../domains/performance/performance.routes';
import userRoutes from '../domains/users/users.routes';
import dashboardRoutes from '../domains/dashboard/dashboard.routes';
import backupRoutes from '../domains/backup/backup.routes';
import slaveRoutes from '../domains/cluster/cluster.routes';
import nodeSyncRoutes from '../domains/cluster/node-sync.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/account', accountRoutes);
router.use('/domains', domainRoutes);
router.use('/system', systemRoutes);
router.use('/ssl', sslRoutes);
router.use('/modsec', modsecRoutes);
router.use('/logs', logsRoutes);
router.use('/alerts', alertsRoutes);
router.use('/acl', aclRoutes);
router.use('/performance', performanceRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/backup', backupRoutes);
router.use('/slave', slaveRoutes);
router.use('/system-config', systemConfigRoutes);
router.use('/node-sync', nodeSyncRoutes);

export default router;
