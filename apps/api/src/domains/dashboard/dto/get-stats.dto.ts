/**
 * DTO for Dashboard Stats Response
 */
import { DashboardStats } from '../dashboard.types';

export interface GetStatsResponseDto {
  success: boolean;
  data: DashboardStats;
}
