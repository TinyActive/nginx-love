/**
 * DTO for GET /api/performance/stats request
 */
export interface GetStatsQueryDto {
  domain?: string;
  timeRange?: string;
}

/**
 * DTO for GET /api/performance/stats response
 */
export interface GetStatsResponseDto {
  success: boolean;
  data: StatsDataDto;
}

/**
 * Stats data structure
 */
export interface StatsDataDto {
  avgResponseTime: number;
  avgThroughput: number;
  avgErrorRate: number;
  totalRequests: number;
  slowRequests: SlowRequestDto[];
  highErrorPeriods: HighErrorPeriodDto[];
}

/**
 * Slow request information
 */
export interface SlowRequestDto {
  domain: string;
  timestamp: Date;
  responseTime: number;
}

/**
 * High error period information
 */
export interface HighErrorPeriodDto {
  domain: string;
  timestamp: Date;
  errorRate: number;
}
