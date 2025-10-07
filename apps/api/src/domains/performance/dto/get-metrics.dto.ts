/**
 * DTO for GET /api/performance/metrics request
 */
export interface GetMetricsQueryDto {
  domain?: string;
  timeRange?: string;
}

/**
 * DTO for GET /api/performance/metrics response
 */
export interface GetMetricsResponseDto {
  success: boolean;
  data: MetricDto[];
}

/**
 * Individual metric DTO
 */
export interface MetricDto {
  domain: string;
  timestamp: Date;
  responseTime: number;
  throughput: number;
  errorRate: number;
  requestCount: number;
}
