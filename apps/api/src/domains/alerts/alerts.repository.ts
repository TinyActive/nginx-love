/**
 * Alerts Repository
 * Database operations for alert rules and notification channels
 */

import prisma from '../../config/database';
import {
  CreateNotificationChannelDto,
  UpdateNotificationChannelDto,
  CreateAlertRuleDto,
  UpdateAlertRuleDto
} from './dto';
import { NotificationChannel, AlertRuleWithChannels } from './alerts.types';

/**
 * Notification Channel Repository
 */
export class NotificationChannelRepository {
  /**
   * Get all notification channels
   */
  async findAll(): Promise<NotificationChannel[]> {
    return await prisma.notificationChannel.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    }) as NotificationChannel[];
  }

  /**
   * Get single notification channel by ID
   */
  async findById(id: string): Promise<NotificationChannel | null> {
    return await prisma.notificationChannel.findUnique({
      where: { id }
    }) as NotificationChannel | null;
  }

  /**
   * Get multiple channels by IDs
   */
  async findByIds(ids: string[]): Promise<NotificationChannel[]> {
    return await prisma.notificationChannel.findMany({
      where: {
        id: {
          in: ids
        }
      }
    }) as NotificationChannel[];
  }

  /**
   * Create notification channel
   */
  async create(data: CreateNotificationChannelDto): Promise<NotificationChannel> {
    return await prisma.notificationChannel.create({
      data: {
        name: data.name,
        type: data.type as any,
        enabled: data.enabled !== undefined ? data.enabled : true,
        config: data.config as any
      }
    }) as NotificationChannel;
  }

  /**
   * Update notification channel
   */
  async update(id: string, data: UpdateNotificationChannelDto): Promise<NotificationChannel> {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.type) updateData.type = data.type;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.config) updateData.config = data.config;

    return await prisma.notificationChannel.update({
      where: { id },
      data: updateData
    }) as NotificationChannel;
  }

  /**
   * Delete notification channel
   */
  async delete(id: string): Promise<void> {
    await prisma.notificationChannel.delete({
      where: { id }
    });
  }
}

/**
 * Alert Rule Repository
 */
export class AlertRuleRepository {
  /**
   * Get all alert rules with their channels
   */
  async findAll(): Promise<AlertRuleWithChannels[]> {
    return await prisma.alertRule.findMany({
      include: {
        channels: {
          include: {
            channel: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) as unknown as AlertRuleWithChannels[];
  }

  /**
   * Get all enabled alert rules with their channels
   */
  async findAllEnabled(): Promise<AlertRuleWithChannels[]> {
    return await prisma.alertRule.findMany({
      where: {
        enabled: true
      },
      include: {
        channels: {
          include: {
            channel: true
          }
        }
      }
    }) as unknown as AlertRuleWithChannels[];
  }

  /**
   * Get single alert rule by ID
   */
  async findById(id: string): Promise<AlertRuleWithChannels | null> {
    return await prisma.alertRule.findUnique({
      where: { id },
      include: {
        channels: {
          include: {
            channel: true
          }
        }
      }
    }) as unknown as AlertRuleWithChannels | null;
  }

  /**
   * Create alert rule
   */
  async create(data: CreateAlertRuleDto): Promise<AlertRuleWithChannels> {
    return await prisma.alertRule.create({
      data: {
        name: data.name,
        condition: data.condition,
        threshold: data.threshold,
        severity: data.severity as any,
        enabled: data.enabled !== undefined ? data.enabled : true,
        channels: data.channels && data.channels.length > 0 ? {
          create: data.channels.map((channelId: string) => ({
            channelId
          }))
        } : undefined
      },
      include: {
        channels: {
          include: {
            channel: true
          }
        }
      }
    }) as unknown as AlertRuleWithChannels;
  }

  /**
   * Update alert rule
   */
  async update(id: string, data: UpdateAlertRuleDto): Promise<AlertRuleWithChannels> {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.condition) updateData.condition = data.condition;
    if (data.threshold !== undefined) updateData.threshold = data.threshold;
    if (data.severity) updateData.severity = data.severity;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.channels) {
      updateData.channels = {
        create: data.channels.map((channelId: string) => ({
          channelId
        }))
      };
    }

    return await prisma.alertRule.update({
      where: { id },
      data: updateData,
      include: {
        channels: {
          include: {
            channel: true
          }
        }
      }
    }) as unknown as AlertRuleWithChannels;
  }

  /**
   * Delete alert rule channel associations
   */
  async deleteChannelAssociations(ruleId: string): Promise<void> {
    await prisma.alertRuleChannel.deleteMany({
      where: { ruleId }
    });
  }

  /**
   * Delete alert rule
   */
  async delete(id: string): Promise<void> {
    await prisma.alertRule.delete({
      where: { id }
    });
  }
}

// Export singleton instances
export const notificationChannelRepository = new NotificationChannelRepository();
export const alertRuleRepository = new AlertRuleRepository();
