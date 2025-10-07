/**
 * Dashboard Domain Types
 */

export interface DomainStats {
  total: number;
  active: number;
  errors: number;
}

export interface AlertStats {
  total: number;
  unacknowledged: number;
  critical: number;
}

export interface TrafficStats {
  requestsPerDay: string;
  requestsPerSecond: number;
}

export interface SystemStats {
  cpuUsage: number;
  memoryUsage: number;
  cpuCores: number;
}

export interface DashboardStats {
  domains: DomainStats;
  alerts: AlertStats;
  traffic: TrafficStats;
  uptime: string;
  system: SystemStats;
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface SystemMetrics {
  cpu: MetricDataPoint[];
  memory: MetricDataPoint[];
  bandwidth: MetricDataPoint[];
  requests: MetricDataPoint[];
}

export type MetricPeriod = '24h' | '7d' | '30d';

export interface MetricsQueryParams {
  period?: MetricPeriod;
}

export interface RecentAlertsQueryParams {
  limit?: number;
}
