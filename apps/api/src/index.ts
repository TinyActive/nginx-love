import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { createCorsOriginResolver, describeCorsPolicy } from './config/cors';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import logger from './utils/logger';
import { initializeNginxForSSL } from './utils/nginx-setup';
import { modSecSetupService } from './domains/modsec/services/modsec-setup.service';
import { botSetupService } from './domains/bot-manager/services/bot-setup.service';
import { startAlertMonitoring, stopAlertMonitoring } from './domains/alerts/services/alert-monitoring.service';
import { startSlaveNodeStatusCheck, stopSlaveNodeStatusCheck } from './domains/cluster/services/slave-status-checker.service';
import { backupSchedulerService } from './domains/backup/services/backup-scheduler.service';
import { sslSchedulerService } from './domains/ssl/services/ssl-scheduler.service';

const app: Application = express();
let monitoringTimer: NodeJS.Timeout | null = null;
let slaveStatusTimer: NodeJS.Timeout | null = null;
let backupSchedulerTimer: NodeJS.Timeout | null = null;
let sslSchedulerTimer: NodeJS.Timeout | null = null;

// Security middleware
// app.use(helmet());

if (process.env.API_BEHIND_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// CORS — disabled when API is behind same-origin nginx proxy (Docker production)
if (process.env.DISABLE_CORS !== 'true') {
  app.use(cors({
    origin: createCorsOriginResolver(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true,
  }));
}
// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = config.port;

// Initialize nginx configuration for SSL/ACME
initializeNginxForSSL().catch((error) => {
  logger.warn(`Failed to initialize nginx for SSL: ${error.message}`);
  logger.warn('SSL features may not work properly. Please ensure nginx is installed and you have proper permissions.');
});

// Initialize ModSecurity configuration for CRS management
modSecSetupService.initializeModSecurityConfig().catch((error) => {
  logger.warn(`Failed to initialize ModSecurity config: ${error.message}`);
  logger.warn('CRS rule management features may not work properly.');
});

// Initialize Bot Manager (JA4) directories and config placeholders
botSetupService.initializeBotManagerConfig().catch((error) => {
  logger.warn(`Failed to initialize Bot Manager config: ${error.message}`);
});

const server = app.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
  if (process.env.DISABLE_CORS === 'true') {
    logger.info('📡 CORS disabled — API behind same-origin proxy');
  } else {
    logger.info(`📡 CORS policy: ${describeCorsPolicy()}`);
  }
  
  // Start alert monitoring service (global scan every 10 seconds)
  // Each rule has its own checkInterval for when to actually check
  monitoringTimer = startAlertMonitoring(10);
  
  // Start slave node status checker (check every minute)
  slaveStatusTimer = startSlaveNodeStatusCheck();
  
  // Initialize and start backup scheduler (check every minute)
  try {
    await backupSchedulerService.initializeSchedules();
    backupSchedulerTimer = backupSchedulerService.start(60000);
    logger.info('📦 Backup scheduler initialized and started');
  } catch (error) {
    logger.error('Failed to start backup scheduler:', error);
  }
  
  // Start SSL auto-renew scheduler (check every hour, renew if expires in 30 days)
  try {
    sslSchedulerTimer = sslSchedulerService.start(3600000, 30);
    logger.info('🔒 SSL auto-renew scheduler started');
  } catch (error) {
    logger.error('Failed to start SSL auto-renew scheduler:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  if (monitoringTimer) {
    stopAlertMonitoring(monitoringTimer);
  }
  if (slaveStatusTimer) {
    stopSlaveNodeStatusCheck(slaveStatusTimer);
  }
  if (backupSchedulerTimer) {
    backupSchedulerService.stop(backupSchedulerTimer);
  }
  if (sslSchedulerTimer) {
    sslSchedulerService.stop(sslSchedulerTimer);
  }
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  if (monitoringTimer) {
    stopAlertMonitoring(monitoringTimer);
  }
  if (slaveStatusTimer) {
    stopSlaveNodeStatusCheck(slaveStatusTimer);
  }
  if (backupSchedulerTimer) {
    backupSchedulerService.stop(backupSchedulerTimer);
  }
  if (sslSchedulerTimer) {
    sslSchedulerService.stop(sslSchedulerTimer);
  }
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
