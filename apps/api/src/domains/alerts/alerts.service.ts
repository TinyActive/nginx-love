/**
 * Alerts Service
 * Business logic for alert rules and notification channels
 */

import logger from '../../utils/logger';
import {
  notificationChannelRepository,
  alertRuleRepository
} from './alerts.repository';
import { sendTestNotification } from './services/notification.service';
import {
  CreateNotificationChannelDto,
  UpdateNotificationChannelDto,
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
  NotificationChannelResponseDto,
  AlertRuleResponseDto
} from './dto';
import { NotificationChannel, AlertRuleWithChannels } from './alerts.types';

/**
 * Notification Channel Service
 */
export class NotificationChannelService {
  /**
   * Get all notification channels
   */
  async getAllChannels(): Promise<NotificationChannelResponseDto[]> {
    return await notificationChannelRepository.findAll();
  }

  /**
   * Get single notification channel
   */
  async getChannelById(id: string): Promise<NotificationChannelResponseDto | null> {
    return await notificationChannelRepository.findById(id);
  }

  /**
   * Create notification channel
   */
  async createChannel(data: CreateNotificationChannelDto, username?: string): Promise<NotificationChannelResponseDto> {
    // Validation
    if (!data.name || !data.type || !data.config) {
      throw new Error('Name, type, and config are required');
    }

    if (data.type === 'email' && !data.config.email) {
      throw new Error('Email is required for email channel');
    }

    if (data.type === 'telegram' && (!data.config.chatId || !data.config.botToken)) {
      throw new Error('Chat ID and Bot Token are required for Telegram channel');
    }

    const channel = await notificationChannelRepository.create(data);

    logger.info(`User ${username} created notification channel: ${channel.name}`);

    return channel;
  }

  /**
   * Update notification channel
   */
  async updateChannel(
    id: string,
    data: UpdateNotificationChannelDto,
    username?: string
  ): Promise<NotificationChannelResponseDto> {
    const existingChannel = await notificationChannelRepository.findById(id);

    if (!existingChannel) {
      throw new Error('Notification channel not found');
    }

    const channel = await notificationChannelRepository.update(id, data);

    logger.info(`User ${username} updated notification channel: ${channel.name}`);

    return channel;
  }

  /**
   * Delete notification channel
   */
  async deleteChannel(id: string, username?: string): Promise<void> {
    const channel = await notificationChannelRepository.findById(id);

    if (!channel) {
      throw new Error('Notification channel not found');
    }

    await notificationChannelRepository.delete(id);

    logger.info(`User ${username} deleted notification channel: ${channel.name}`);
  }

  /**
   * Test notification channel
   */
  async testChannel(id: string) {
    const channel = await notificationChannelRepository.findById(id);

    if (!channel) {
      throw new Error('Notification channel not found');
    }

    if (!channel.enabled) {
      throw new Error('Channel is disabled');
    }

    // Send actual test notification
    logger.info(`Sending test notification to channel: ${channel.name} (type: ${channel.type})`);

    const result = await sendTestNotification(
      channel.name,
      channel.type,
      channel.config as any
    );

    if (result.success) {
      logger.info(`✅ ${result.message}`);
    } else {
      logger.error(`❌ Failed to send test notification: ${result.message}`);
    }

    return result;
  }
}

/**
 * Alert Rule Service
 */
export class AlertRuleService {
  /**
   * Transform alert rule to response format
   */
  private transformAlertRule(rule: AlertRuleWithChannels): AlertRuleResponseDto {
    return {
      id: rule.id,
      name: rule.name,
      condition: rule.condition,
      threshold: rule.threshold,
      severity: rule.severity,
      enabled: rule.enabled,
      channels: rule.channels.map(rc => rc.channelId),
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt
    };
  }

  /**
   * Get all alert rules
   */
  async getAllRules(): Promise<AlertRuleResponseDto[]> {
    const rules = await alertRuleRepository.findAll();
    return rules.map(rule => this.transformAlertRule(rule));
  }

  /**
   * Get single alert rule
   */
  async getRuleById(id: string): Promise<AlertRuleResponseDto | null> {
    const rule = await alertRuleRepository.findById(id);
    if (!rule) {
      return null;
    }
    return this.transformAlertRule(rule);
  }

  /**
   * Create alert rule
   */
  async createRule(data: CreateAlertRuleDto, username?: string): Promise<AlertRuleResponseDto> {
    // Validation
    if (!data.name || !data.condition || data.threshold === undefined || !data.severity) {
      throw new Error('Name, condition, threshold, and severity are required');
    }

    // Verify channels exist
    if (data.channels && data.channels.length > 0) {
      const existingChannels = await notificationChannelRepository.findByIds(data.channels);

      if (existingChannels.length !== data.channels.length) {
        throw new Error('One or more notification channels not found');
      }
    }

    const rule = await alertRuleRepository.create(data);

    logger.info(`User ${username} created alert rule: ${rule.name}`);

    return this.transformAlertRule(rule);
  }

  /**
   * Update alert rule
   */
  async updateRule(
    id: string,
    data: UpdateAlertRuleDto,
    username?: string
  ): Promise<AlertRuleResponseDto> {
    const existingRule = await alertRuleRepository.findById(id);

    if (!existingRule) {
      throw new Error('Alert rule not found');
    }

    // If channels are being updated, verify they exist
    if (data.channels) {
      const existingChannels = await notificationChannelRepository.findByIds(data.channels);

      if (existingChannels.length !== data.channels.length) {
        throw new Error('One or more notification channels not found');
      }

      // Delete existing channel associations
      await alertRuleRepository.deleteChannelAssociations(id);
    }

    // Update rule
    const rule = await alertRuleRepository.update(id, data);

    logger.info(`User ${username} updated alert rule: ${rule.name}`);

    return this.transformAlertRule(rule);
  }

  /**
   * Delete alert rule
   */
  async deleteRule(id: string, username?: string): Promise<void> {
    const rule = await alertRuleRepository.findById(id);

    if (!rule) {
      throw new Error('Alert rule not found');
    }

    await alertRuleRepository.delete(id);

    logger.info(`User ${username} deleted alert rule: ${rule.name}`);
  }
}

// Export singleton instances
export const notificationChannelService = new NotificationChannelService();
export const alertRuleService = new AlertRuleService();
