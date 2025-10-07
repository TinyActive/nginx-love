/**
 * Dashboard Controller
 * HTTP request handlers for dashboard endpoints
 */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { DashboardService } from './dashboard.service';
import { GetMetricsQueryDto, GetRecentAlertsQueryDto } from './dto';

const dashboardService = new DashboardService();

/**
 * Get dashboard overview statistics
 */
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const stats = await dashboardService.getDashboardStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
    });
  }
};

/**
 * Get system metrics (CPU, Memory, Bandwidth)
 */
export const getSystemMetrics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { period = '24h' } = req.query as GetMetricsQueryDto;

    const metrics = await dashboardService.getSystemMetrics(period);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Get system metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system metrics',
    });
  }
};

/**
 * Get recent alerts for dashboard
 */
export const getRecentAlerts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit = 5 } = req.query as GetRecentAlertsQueryDto;

    const alerts = await dashboardService.getRecentAlerts(Number(limit));

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    logger.error('Get recent alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent alerts',
    });
  }
};
