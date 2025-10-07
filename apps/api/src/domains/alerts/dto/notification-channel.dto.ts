/**
 * Notification Channel DTOs
 */

import { NotificationConfig } from '../alerts.types';

export interface CreateNotificationChannelDto {
  name: string;
  type: string;
  enabled?: boolean;
  config: NotificationConfig;
}

export interface UpdateNotificationChannelDto {
  name?: string;
  type?: string;
  enabled?: boolean;
  config?: NotificationConfig;
}

export interface NotificationChannelResponseDto {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: NotificationConfig;
  createdAt: Date;
  updatedAt: Date;
}
