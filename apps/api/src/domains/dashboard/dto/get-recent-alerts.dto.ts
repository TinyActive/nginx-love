/**
 * DTO for Recent Alerts
 */
import { RecentAlertsQueryParams } from '../dashboard.types';

export interface GetRecentAlertsQueryDto extends RecentAlertsQueryParams {
  limit?: number;
}

export interface GetRecentAlertsResponseDto {
  success: boolean;
  data: any[]; // Alert history records from Prisma
}
