/**
 * Performance Service
 *
 * Business logic layer for performance monitoring.
 * Orchestrates metrics collection, calculation, and storage.
 */

import logger from '../../utils/logger';
import { collectMetricsFromLogs, calculateMetrics } from './services/metrics.service';
import { saveMetrics, findMetrics, deleteOldMetrics } from './performance.repository';
import {
  PerformanceMetrics,
  PerformanceStats,
  TIME_RANGE_MAP,
  TimeRange,
  PerformanceMetricsFilter,
  CleanupResult
} from './performance.types';

/**
 * Get performance metrics for a given domain and time range
 */
export const getMetrics = async (domain: string = 'all', timeRange: string = '1h'): Promise<PerformanceMetrics[]> => {
  logger.info(`[Performance Service] Fetching metrics for domain: ${domain}, timeRange: ${timeRange}`);

  // Parse timeRange to minutes
  const minutes = TIME_RANGE_MAP[timeRange as TimeRange] || 60;

  // Collect and calculate metrics from logs
  logger.info(`[Performance Service] Collecting metrics from logs for ${minutes} minutes`);
  const logEntries = await collectMetricsFromLogs({ domain, minutes });
  logger.info(`[Performance Service] Collected ${logEntries.length} log entries`);

  const metrics = calculateMetrics(logEntries, 5); // 5-minute intervals
  logger.info(`[Performance Service] Calculated ${metrics.length} metrics`);

  // Save recent metrics to database for historical tracking
  if (metrics.length > 0) {
    const latestMetrics = metrics.slice(0, 5); // Save last 5 intervals
    await saveMetrics(latestMetrics);
  }

  return metrics;
};

/**
 * Get aggregated performance statistics
 */
export const getStats = async (domain: string = 'all', timeRange: string = '1h'): Promise<PerformanceStats> => {
  logger.info(`[Performance Service] Fetching stats for domain: ${domain}, timeRange: ${timeRange}`);

  // Parse timeRange
  const minutes = TIME_RANGE_MAP[timeRange as TimeRange] || 60;

  // Collect metrics from logs
  logger.info(`[Performance Service] Collecting metrics from logs for ${minutes} minutes`);
  const logEntries = await collectMetricsFromLogs({ domain, minutes });
  logger.info(`[Performance Service] Collected ${logEntries.length} log entries`);

  const metrics = calculateMetrics(logEntries, 5);
  logger.info(`[Performance Service] Calculated ${metrics.length} metrics`);

  if (metrics.length === 0) {
    return {
      avgResponseTime: 0,
      avgThroughput: 0,
      avgErrorRate: 0,
      totalRequests: 0,
      slowRequests: [],
      highErrorPeriods: []
    };
  }

  // Calculate aggregated stats
  const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
  const avgThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length;
  const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
  const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);

  // Find slow requests (> 200ms)
  const slowRequests = metrics
    .filter(m => m.responseTime > 200)
    .slice(0, 5)
    .map(m => ({
      domain: m.domain,
      timestamp: m.timestamp,
      responseTime: m.responseTime
    }));

  // Find high error periods (> 3%)
  const highErrorPeriods = metrics
    .filter(m => m.errorRate > 3)
    .slice(0, 5)
    .map(m => ({
      domain: m.domain,
      timestamp: m.timestamp,
      errorRate: m.errorRate
    }));

  return {
    avgResponseTime,
    avgThroughput,
    avgErrorRate,
    totalRequests,
    slowRequests,
    highErrorPeriods
  };
};

/**
 * Get historical metrics from database
 */
export const getHistory = async (domain: string = 'all', limit: number = 100): Promise<any[]> => {
  const filter: PerformanceMetricsFilter = {
    domain,
    limit
  };

  return await findMetrics(filter);
};

/**
 * Clean up old metrics from database
 */
export const cleanup = async (days: number = 7): Promise<CleanupResult> => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return await deleteOldMetrics(cutoffDate);
};
