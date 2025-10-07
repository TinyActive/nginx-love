/**
 * Dashboard Repository
 * Database operations for dashboard statistics
 */

import prisma from '../../config/database';

/**
 * Dashboard Repository
 * Handles all database queries for dashboard data
 */
export class DashboardRepository {
  /**
   * Get total domain count
   */
  async getTotalDomains(): Promise<number> {
    return await prisma.domain.count();
  }

  /**
   * Get active domain count
   */
  async getActiveDomains(): Promise<number> {
    return await prisma.domain.count({
      where: { status: 'active' },
    });
  }

  /**
   * Get error domain count
   */
  async getErrorDomains(): Promise<number> {
    return await prisma.domain.count({
      where: { status: 'error' },
    });
  }

  /**
   * Get all domain statistics in parallel
   */
  async getDomainStats(): Promise<{
    total: number;
    active: number;
    errors: number;
  }> {
    const [total, active, errors] = await Promise.all([
      this.getTotalDomains(),
      this.getActiveDomains(),
      this.getErrorDomains(),
    ]);

    return { total, active, errors };
  }

  /**
   * Get total alert count
   */
  async getTotalAlerts(): Promise<number> {
    return await prisma.alertHistory.count();
  }

  /**
   * Get unacknowledged alert count
   */
  async getUnacknowledgedAlerts(): Promise<number> {
    return await prisma.alertHistory.count({
      where: { acknowledged: false },
    });
  }

  /**
   * Get critical unacknowledged alert count
   */
  async getCriticalAlerts(): Promise<number> {
    return await prisma.alertHistory.count({
      where: {
        severity: 'critical',
        acknowledged: false,
      },
    });
  }

  /**
   * Get all alert statistics in parallel
   */
  async getAlertStats(): Promise<{
    total: number;
    unacknowledged: number;
    critical: number;
  }> {
    const [total, unacknowledged, critical] = await Promise.all([
      this.getTotalAlerts(),
      this.getUnacknowledgedAlerts(),
      this.getCriticalAlerts(),
    ]);

    return { total, unacknowledged, critical };
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number): Promise<any[]> {
    return await prisma.alertHistory.findMany({
      take: limit,
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}

// Export singleton instance
export const dashboardRepository = new DashboardRepository();
