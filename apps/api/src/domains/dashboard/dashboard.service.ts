/**
 * Dashboard Service
 * Business logic for dashboard data aggregation and statistics
 */
import logger from '../../utils/logger';
import { dashboardRepository } from './dashboard.repository';
import { dashboardStatsService } from './services/dashboard-stats.service';
import {
  DashboardStats,
  SystemMetrics,
  MetricPeriod,
} from './dashboard.types';

export class DashboardService {
  /**
   * Get dashboard overview statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get domain and alert statistics from repository
      const [domains, alerts, trafficStats, cpuUsage, memoryUsage] = await Promise.all([
        dashboardRepository.getDomainStats(),
        dashboardRepository.getAlertStats(),
        dashboardStatsService.getTrafficStats(),
        dashboardStatsService.getCurrentCPUUsage(),
        Promise.resolve(dashboardStatsService.getCurrentMemoryUsage()),
      ]);

      // Get system metrics
      const uptime = dashboardStatsService.calculateUptimePercentage();
      const cpuCores = dashboardStatsService.getCPUCoreCount();

      return {
        domains,
        alerts,
        traffic: trafficStats,
        uptime,
        system: {
          cpuUsage: parseFloat(cpuUsage.toFixed(2)),
          memoryUsage: parseFloat(memoryUsage.toFixed(2)),
          cpuCores,
        },
      };
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  /**
   * Get system metrics (CPU, Memory, Bandwidth, Requests)
   */
  async getSystemMetrics(period: MetricPeriod = '24h'): Promise<SystemMetrics> {
    try {
      // Generate time-series data based on period
      const dataPoints = period === '24h' ? 24 : period === '7d' ? 168 : 30;
      const interval = period === '24h' ? 3600000 : period === '7d' ? 3600000 : 86400000;

      const [cpu, memory, bandwidth, requests] = await Promise.all([
        dashboardStatsService.generateCPUMetrics(dataPoints, interval),
        dashboardStatsService.generateMemoryMetrics(dataPoints, interval),
        dashboardStatsService.generateBandwidthMetrics(dataPoints, interval),
        dashboardStatsService.generateRequestMetrics(dataPoints, interval),
      ]);

      return {
        cpu,
        memory,
        bandwidth,
        requests,
      };
    } catch (error) {
      logger.error('Get system metrics error:', error);
      throw error;
    }
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number = 5): Promise<any[]> {
    try {
      return await dashboardRepository.getRecentAlerts(limit);
    } catch (error) {
      logger.error('Get recent alerts error:', error);
      throw error;
    }
  }

}
