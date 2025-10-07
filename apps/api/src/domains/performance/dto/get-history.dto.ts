/**
 * DTO for GET /api/performance/history request
 */
export interface GetHistoryQueryDto {
  domain?: string;
  limit?: string;
}

/**
 * DTO for GET /api/performance/history response
 */
export interface GetHistoryResponseDto {
  success: boolean;
  data: HistoryMetricDto[];
}

/**
 * Historical metric from database
 */
export interface HistoryMetricDto {
  id: string;
  domain: string;
  timestamp: Date;
  responseTime: number;
  throughput: number;
  errorRate: number;
  requestCount: number;
  createdAt: Date;
}
