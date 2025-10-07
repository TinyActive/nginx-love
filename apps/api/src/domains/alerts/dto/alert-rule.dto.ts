/**
 * Alert Rule DTOs
 */

export interface CreateAlertRuleDto {
  name: string;
  condition: string;
  threshold: number;
  severity: string;
  enabled?: boolean;
  channels?: string[];
}

export interface UpdateAlertRuleDto {
  name?: string;
  condition?: string;
  threshold?: number;
  severity?: string;
  enabled?: boolean;
  channels?: string[];
}

export interface AlertRuleResponseDto {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: string;
  enabled: boolean;
  channels: string[];
  createdAt: Date;
  updatedAt: Date;
}
