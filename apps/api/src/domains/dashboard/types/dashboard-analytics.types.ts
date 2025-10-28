/**
 * Dashboard Analytics Types
 * Types for advanced dashboard statistics and analytics
 */

// Base interfaces
interface BaseCountStats {
  count: number;
}

interface TimestampedEntry {
  timestamp: string;
}

interface ResponseTimeMetrics {
  requestCount: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
}

// Status code fields interface
interface StatusCodeFields {
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

// Request trend data point
export interface RequestTrendDataPoint extends TimestampedEntry, StatusCodeFields {
  total: number;
}

// Slow request entry
export interface SlowRequestEntry extends ResponseTimeMetrics {
  path: string;
}

// Attack type statistics
export interface AttackTypeStats extends BaseCountStats, TimestampedEntry {
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
  uniqueId?: string;
  severity?: string;
  action: string;
  logId: string;
}

// IP analytics entry
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
