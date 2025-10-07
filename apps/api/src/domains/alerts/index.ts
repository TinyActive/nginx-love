/**
 * Alerts Domain - Main Export File
 */

// Export routes as default
export { default } from './alerts.routes';

// Export types
export * from './alerts.types';

// Export DTOs
export * from './dto';

// Export services
export { notificationChannelService, alertRuleService } from './alerts.service';

// Export monitoring services
export {
  runAlertMonitoring,
  startAlertMonitoring,
  stopAlertMonitoring
} from './services/alert-monitoring.service';

export {
  sendTelegramNotification,
  sendEmailNotification,
  sendTestNotification,
  sendAlertNotification
} from './services/notification.service';
