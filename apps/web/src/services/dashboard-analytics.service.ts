import api from './api';

/**
 * Dashboard Analytics Types
 */

// HTTP Status codes mapping type
type HttpStatusCodes = 200 | 301 | 302 | 400 | 403 | 404 | 500 | 502 | 503;

// Base statistics interface for count-based metrics
interface BaseCountStats {
  count: number;
}

// Base timestamp interface
interface TimestampedEntry {
  timestamp: string;
}

// Request metrics with min/max/avg pattern
interface RequestMetrics {
  requestCount: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
}

// Request trend data point with dynamic status codes
export interface RequestTrendDataPoint extends TimestampedEntry {
  total: number;
  status200: number;
  status301: number;
  status302: number;
  status400: number;
  status403: number;
  status404: number;
  status500: number;
  status502: number;
  status503: number;
  statusOther: number;
}

// Slow request entry
export interface SlowRequestEntry extends RequestMetrics {
  path: string;
}

// Attack type statistics
export interface AttackTypeStats extends BaseCountStats {
  attackType: string;
  severity: string;
  lastOccurred: string;
  ruleIds: string[];
}

// Latest attack/security event
export interface LatestAttackEntry extends TimestampedEntry {
  id: string;
  attackerIp: string;
  domain?: string;
  urlPath: string;
  attackType: string;
  ruleId?: string;
  severity?: string;
  action: string;
  logId: string;
}

// IP analytics entry with count-based metrics
export interface IpAnalyticsEntry {
  ip: string;
  requestCount: number;
  errorCount: number;
  attackCount: number;
  lastSeen: string;
  userAgent?: string;
}

// Attack vs Normal request ratio
export interface AttackRatioStats {
  totalRequests: number;
  attackRequests: number;
  normalRequests: number;
  attackPercentage: number;
}

// Period type for analytics
export type AnalyticsPeriod = 'day' | 'week' | 'month';

// Request analytics response
export interface RequestAnalyticsResponse {
  period: AnalyticsPeriod;
  topIps: IpAnalyticsEntry[];
  totalRequests: number;
  uniqueIps: number;
}

// Complete dashboard analytics response
export interface DashboardAnalyticsResponse {
  requestTrend: RequestTrendDataPoint[];
  slowRequests: SlowRequestEntry[];
  latestAttacks: AttackTypeStats[];
  latestNews: LatestAttackEntry[];
  requestAnalytics: RequestAnalyticsResponse;
  attackRatio: AttackRatioStats;
}

/**
 * Generic API caller to reduce duplication
 */
const fetchAnalytics = async <T>(
  endpoint: string,
  params?: Record<string, any>
): Promise<T> => {
  const response = await api.get(`/dashboard/analytics/${endpoint}`, { params });
  return response.data.data;
};

/**
 * Dashboard Analytics Service
 */
export const dashboardAnalyticsService = {
  /**
   * Get request trend analytics (auto-refresh every 5s)
   */
  getRequestTrend: (intervalSeconds: number = 5) =>
    fetchAnalytics<RequestTrendDataPoint[]>('request-trend', { interval: intervalSeconds }),

  /**
   * Get slow requests from performance monitoring
   */
  getSlowRequests: (limit: number = 10) =>
    fetchAnalytics<SlowRequestEntry[]>('slow-requests', { limit }),

  /**
   * Get latest attack statistics (top 5 in 24h)
   */
  getLatestAttackStats: (limit: number = 5) =>
    fetchAnalytics<AttackTypeStats[]>('latest-attacks', { limit }),

  /**
   * Get latest security news/events
   */
  getLatestNews: (limit: number = 20) =>
    fetchAnalytics<LatestAttackEntry[]>('latest-news', { limit }),

  /**
   * Get request analytics (top IPs by period)
   */
  getRequestAnalytics: (period: AnalyticsPeriod = 'day') =>
    fetchAnalytics<RequestAnalyticsResponse>('request-analytics', { period }),

  /**
   * Get attack vs normal request ratio
   */
  getAttackRatio: () =>
    fetchAnalytics<AttackRatioStats>('attack-ratio'),

  /**
   * Get complete dashboard analytics (all in one)
   */
  getDashboardAnalytics: () =>
    fetchAnalytics<DashboardAnalyticsResponse>(''),
};

// Export individual functions for backward compatibility
export const getRequestTrend = dashboardAnalyticsService.getRequestTrend;
export const getSlowRequests = dashboardAnalyticsService.getSlowRequests;
export const getLatestAttackStats = dashboardAnalyticsService.getLatestAttackStats;
export const getLatestNews = dashboardAnalyticsService.getLatestNews;
export const getRequestAnalytics = dashboardAnalyticsService.getRequestAnalytics;
export const getAttackRatio = dashboardAnalyticsService.getAttackRatio;
export const getDashboardAnalytics = dashboardAnalyticsService.getDashboardAnalytics;

export default dashboardAnalyticsService;
