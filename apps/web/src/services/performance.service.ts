import api from './api';
import { PerformanceMetric } from '@/types';

interface PerformanceStats {
  avgResponseTime: number;
  avgThroughput: number;
  avgErrorRate: number;
  totalRequests: number;
  slowRequests: Array<{
    domain: string;
    timestamp: string;
    responseTime: number;
  }>;
  highErrorPeriods: Array<{
    domain: string;
    timestamp: string;
    errorRate: number;
  }>;
}

export const performanceService = {
  /**
   * Get performance metrics
   * @param domain - Domain name or 'all' for all domains
   * @param timeRange - Time range: 5m, 15m, 1h, 6h, 24h
   */
  async getMetrics(domain: string = 'all', timeRange: string = '1h'): Promise<PerformanceMetric[]> {
    console.log(`[Performance Service] Fetching metrics for domain: ${domain}, timeRange: ${timeRange}`);
    try {
      const response = await api.get<{ success: boolean; data: any[] }>(
        `/performance/metrics?domain=${domain}&timeRange=${timeRange}`
      );
      console.log(`[Performance Service] Successfully fetched ${response.data.data.length} metrics`);
      return response.data.data.map((metric: any) => ({
        id: metric.id || `${metric.domain}-${metric.timestamp}`,
        domain: metric.domain,
        timestamp: metric.timestamp,
        responseTime: metric.responseTime,
        throughput: metric.throughput,
        errorRate: metric.errorRate,
        requestCount: metric.requestCount
      }));
    } catch (error) {
      console.error('[Performance Service] Error fetching metrics:', error);
      throw error;
    }
  },

  /**
   * Get aggregated performance statistics
   * @param domain - Domain name or 'all' for all domains
   * @param timeRange - Time range: 5m, 15m, 1h, 6h, 24h
   */
  async getStats(domain: string = 'all', timeRange: string = '1h'): Promise<PerformanceStats> {
    console.log(`[Performance Service] Fetching stats for domain: ${domain}, timeRange: ${timeRange}`);
    try {
      const response = await api.get<{ success: boolean; data: PerformanceStats }>(
        `/performance/stats?domain=${domain}&timeRange=${timeRange}`
      );
      console.log(`[Performance Service] Successfully fetched stats`);
      return response.data.data;
    } catch (error) {
      console.error('[Performance Service] Error fetching stats:', error);
      throw error;
    }
  },

  /**
   * Get historical metrics from database
   * @param domain - Domain name or 'all' for all domains
   * @param limit - Number of records to fetch
   */
  async getHistory(domain: string = 'all', limit: number = 100): Promise<PerformanceMetric[]> {
    const response = await api.get<{ success: boolean; data: any[] }>(
      `/performance/history?domain=${domain}&limit=${limit}`
    );
    
    return response.data.data.map((metric: any) => ({
      id: metric.id,
      domain: metric.domain,
      timestamp: metric.timestamp,
      responseTime: metric.responseTime,
      throughput: metric.throughput,
      errorRate: metric.errorRate,
      requestCount: metric.requestCount
    }));
  },

  /**
   * Cleanup old metrics
   * @param days - Delete metrics older than this many days
   */
  async cleanup(days: number = 7): Promise<{ deletedCount: number }> {
    const response = await api.delete<{ success: boolean; data: { deletedCount: number } }>(
      `/performance/cleanup?days=${days}`
    );
    
    return response.data.data;
  }
};

export default performanceService;
