/**
 * Alerts Controller
 * HTTP request handlers for alert rules and notification channels
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { notificationChannelService, alertRuleService } from './alerts.service';

/**
 * Get all notification channels
 */
export const getNotificationChannels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const channels = await notificationChannelService.getAllChannels();

    res.json({
      success: true,
      data: channels
    });
  } catch (error) {
    logger.error('Get notification channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get single notification channel
 */
export const getNotificationChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const channel = await notificationChannelService.getChannelById(id);

    if (!channel) {
      res.status(404).json({
        success: false,
        message: 'Notification channel not found'
      });
      return;
    }

    res.json({
      success: true,
      data: channel
    });
  } catch (error) {
    logger.error('Get notification channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create notification channel
 */
export const createNotificationChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, enabled, config } = req.body;

    const channel = await notificationChannelService.createChannel(
      { name, type, enabled, config },
      req.user?.username
    );

    res.status(201).json({
      success: true,
      data: channel
    });
  } catch (error: any) {
    logger.error('Create notification channel error:', error);
    res.status(error.message.includes('required') ? 400 : 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Update notification channel
 */
export const updateNotificationChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, enabled, config } = req.body;

    const channel = await notificationChannelService.updateChannel(
      id,
      { name, type, enabled, config },
      req.user?.username
    );

    res.json({
      success: true,
      data: channel
    });
  } catch (error: any) {
    logger.error('Update notification channel error:', error);
    const statusCode = error.message === 'Notification channel not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Delete notification channel
 */
export const deleteNotificationChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await notificationChannelService.deleteChannel(id, req.user?.username);

    res.json({
      success: true,
      message: 'Notification channel deleted successfully'
    });
  } catch (error: any) {
    logger.error('Delete notification channel error:', error);
    const statusCode = error.message === 'Notification channel not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Test notification channel
 */
export const testNotificationChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await notificationChannelService.testChannel(id);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error: any) {
    logger.error('Test notification channel error:', error);
    const statusCode = error.message === 'Notification channel not found' ? 404 :
                       error.message === 'Channel is disabled' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get all alert rules
 */
export const getAlertRules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rules = await alertRuleService.getAllRules();

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    logger.error('Get alert rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get single alert rule
 */
export const getAlertRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const rule = await alertRuleService.getRuleById(id);

    if (!rule) {
      res.status(404).json({
        success: false,
        message: 'Alert rule not found'
      });
      return;
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    logger.error('Get alert rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create alert rule
 */
export const createAlertRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, condition, threshold, severity, channels, enabled } = req.body;

    const rule = await alertRuleService.createRule(
      { name, condition, threshold, severity, channels, enabled },
      req.user?.username
    );

    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error: any) {
    logger.error('Create alert rule error:', error);
    const statusCode = error.message.includes('required') || error.message.includes('not found') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Update alert rule
 */
export const updateAlertRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, condition, threshold, severity, channels, enabled } = req.body;

    const rule = await alertRuleService.updateRule(
      id,
      { name, condition, threshold, severity, channels, enabled },
      req.user?.username
    );

    res.json({
      success: true,
      data: rule
    });
  } catch (error: any) {
    logger.error('Update alert rule error:', error);
    const statusCode = error.message === 'Alert rule not found' ? 404 :
                       error.message.includes('not found') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Delete alert rule
 */
export const deleteAlertRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await alertRuleService.deleteRule(id, req.user?.username);

    res.json({
      success: true,
      message: 'Alert rule deleted successfully'
    });
  } catch (error: any) {
    logger.error('Delete alert rule error:', error);
    const statusCode = error.message === 'Alert rule not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
