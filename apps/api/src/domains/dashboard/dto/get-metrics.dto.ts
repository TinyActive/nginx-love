/**
 * DTO for System Metrics
 */
import { SystemMetrics, MetricsQueryParams } from '../dashboard.types';

export interface GetMetricsQueryDto extends MetricsQueryParams {
  period?: '24h' | '7d' | '30d';
}

export interface GetMetricsResponseDto {
  success: boolean;
  data: SystemMetrics;
}
