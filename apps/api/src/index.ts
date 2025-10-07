import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import logger from './utils/logger';
import { initializeNginxForSSL } from './utils/nginx-setup';
import { modSecSetupService } from './domains/modsec/services/modsec-setup.service';
import { startAlertMonitoring, stopAlertMonitoring } from './domains/alerts/services/alert-monitoring.service';
import { startSlaveNodeStatusCheck, stopSlaveNodeStatusCheck } from './domains/cluster/services/slave-status-checker.service';

const app: Application = express();
let monitoringTimer: NodeJS.Timeout | null = null;
let slaveStatusTimer: NodeJS.Timeout | null = null;

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

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

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
  logger.info(`📡 CORS enabled for: ${config.cors.origin}`);
  
  // Start alert monitoring service (global scan every 10 seconds)
  // Each rule has its own checkInterval for when to actually check
  monitoringTimer = startAlertMonitoring(10);
  
  // Start slave node status checker (check every minute)
  slaveStatusTimer = startSlaveNodeStatusCheck();
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
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
