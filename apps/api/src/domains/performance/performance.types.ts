/**
 * Performance Domain Types
 *
 * This file contains all type definitions for the Performance domain.
 */

/**
 * Nginx log entry parsed from access logs
 */
export interface NginxLogEntry {
  timestamp: Date;
  domain: string;
  statusCode: number;
  responseTime: number;
  requestMethod: string;
  requestPath: string;
}

/**
 * Raw nginx log entry structure
 */
export interface RawNginxLogEntry {
  remoteAddr: string;
  timestamp: Date;
  request: string;
  status: number;
  bodyBytesSent: number;
  httpReferer: string;
  httpUserAgent: string;
  requestTime?: number;
}

/**
 * Performance metrics for a specific time interval
 */
export interface PerformanceMetrics {
  domain: string;
  timestamp: Date;
  responseTime: number;
  throughput: number;
  errorRate: number;
  requestCount: number;
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
  avgResponseTime: number;
  avgThroughput: number;
  avgErrorRate: number;
  totalRequests: number;
  slowRequests: SlowRequest[];
  highErrorPeriods: HighErrorPeriod[];
}

/**
 * Slow request information
 */
export interface SlowRequest {
  domain: string;
  timestamp: Date;
  responseTime: number;
}

/**
 * High error period information
 */
export interface HighErrorPeriod {
  domain: string;
  timestamp: Date;
  errorRate: number;
}

/**
 * Time range options for querying metrics
 */
export type TimeRange = '5m' | '15m' | '1h' | '6h' | '24h';

/**
 * Time range mapping to minutes
 */
export const TIME_RANGE_MAP: Record<TimeRange, number> = {
  '5m': 5,
  '15m': 15,
  '1h': 60,
  '6h': 360,
  '24h': 1440
};

/**
 * Metrics collection options
 */
export interface MetricsCollectionOptions {
  domain?: string;
  minutes: number;
  intervalMinutes?: number;
}

/**
 * Metrics calculation result
 */
export interface MetricsCalculationResult {
  metrics: PerformanceMetrics[];
  logEntriesCount: number;
}

/**
 * Repository filter options
 */
export interface PerformanceMetricsFilter {
  domain?: string;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  deletedCount: number;
}
