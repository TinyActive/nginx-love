import { ApiResponse } from '../../../shared/types/common.types';
import { SystemMetrics } from '../system.types';

/**
 * Response DTO for system metrics
 */
export interface SystemMetricsResponseDto extends ApiResponse<SystemMetrics> {}
