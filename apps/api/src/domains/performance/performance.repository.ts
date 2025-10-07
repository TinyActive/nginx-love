/**
 * Performance Repository
 *
 * Handles all database operations for performance metrics.
 * Follows the Repository pattern for data access abstraction.
 */

import prisma from '../../config/database';
import logger from '../../utils/logger';
import { PerformanceMetrics, PerformanceMetricsFilter, CleanupResult } from './performance.types';

/**
 * Save a single performance metric to the database
 */
export const saveMetric = async (metric: PerformanceMetrics): Promise<void> => {
  try {
    await prisma.performanceMetric.create({
      data: {
        domain: metric.domain,
        timestamp: metric.timestamp,
        responseTime: metric.responseTime,
        throughput: metric.throughput,
        errorRate: metric.errorRate,
        requestCount: metric.requestCount
      }
    });
  } catch (error) {
    // Ignore duplicate entries (unique constraint violation)
    if (!(error as any).code?.includes('P2002')) {
      logger.error('Failed to save metric to database:', error);
      throw error;
    }
  }
};

/**
 * Save multiple performance metrics to the database
 */
export const saveMetrics = async (metrics: PerformanceMetrics[]): Promise<void> => {
  const savePromises = metrics.map(metric => saveMetric(metric));
  await Promise.allSettled(savePromises);
};

/**
 * Find performance metrics with optional filtering
 */
export const findMetrics = async (filter: PerformanceMetricsFilter = {}): Promise<any[]> => {
  const { domain, limit = 100, startDate, endDate } = filter;

  // Build where clause
  const whereClause: any = {};

  if (domain && domain !== 'all') {
    whereClause.domain = domain;
  }

  if (startDate || endDate) {
    whereClause.timestamp = {};
    if (startDate) {
      whereClause.timestamp.gte = startDate;
    }
    if (endDate) {
      whereClause.timestamp.lte = endDate;
    }
  }

  return await prisma.performanceMetric.findMany({
    where: whereClause,
    orderBy: {
      timestamp: 'desc'
    },
    take: limit
  });
};

/**
 * Delete old metrics before a specific date
 */
export const deleteOldMetrics = async (beforeDate: Date): Promise<CleanupResult> => {
  const result = await prisma.performanceMetric.deleteMany({
    where: {
      timestamp: {
        lt: beforeDate
      }
    }
  });

  logger.info(`Cleaned up ${result.count} old performance metrics`);

  return {
    deletedCount: result.count
  };
};

/**
 * Get metrics count by domain
 */
export const getMetricsCountByDomain = async (domain?: string): Promise<number> => {
  const whereClause = domain && domain !== 'all' ? { domain } : {};

  return await prisma.performanceMetric.count({
    where: whereClause
  });
};

/**
 * Get latest metric timestamp for a domain
 */
export const getLatestMetricTimestamp = async (domain?: string): Promise<Date | null> => {
  const whereClause = domain && domain !== 'all' ? { domain } : {};

  const latest = await prisma.performanceMetric.findFirst({
    where: whereClause,
    orderBy: {
      timestamp: 'desc'
    },
    select: {
      timestamp: true
    }
  });

  return latest?.timestamp || null;
};
