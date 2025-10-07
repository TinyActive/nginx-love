/**
 * Performance Controller
 *
 * Handles HTTP requests for performance monitoring endpoints.
 * Maintains 100% API compatibility with the original implementation.
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import * as performanceService from './performance.service';

/**
 * Get performance metrics
 * GET /api/performance/metrics?domain=example.com&timeRange=1h
 */
export const getPerformanceMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { domain = 'all', timeRange = '1h' } = req.query;

    const metrics = await performanceService.getMetrics(domain as string, timeRange as string);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get performance statistics
 * GET /api/performance/stats?domain=example.com&timeRange=1h
 */
export const getPerformanceStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { domain = 'all', timeRange = '1h' } = req.query;

    const stats = await performanceService.getStats(domain as string, timeRange as string);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get performance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get historical metrics from database
 * GET /api/performance/history?domain=example.com&limit=100
 */
export const getPerformanceHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { domain = 'all', limit = '100' } = req.query;

    const metrics = await performanceService.getHistory(domain as string, parseInt(limit as string));

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Get performance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Clean old metrics from database
 * DELETE /api/performance/cleanup?days=7
 */
export const cleanupOldMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { days = '7' } = req.query;

    const result = await performanceService.cleanup(parseInt(days as string));

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old metrics`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    logger.error('Cleanup old metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
