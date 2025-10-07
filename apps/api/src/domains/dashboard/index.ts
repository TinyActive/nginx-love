/**
 * Dashboard Domain - Main Export File
 */

// Export routes as default
export { default } from './dashboard.routes';

// Export types
export * from './dashboard.types';

// Export DTOs
export * from './dto';

// Export service
export { DashboardService } from './dashboard.service';

// Export repository
export { dashboardRepository, DashboardRepository } from './dashboard.repository';

// Export stats service
export { dashboardStatsService, DashboardStatsService } from './services/dashboard-stats.service';
