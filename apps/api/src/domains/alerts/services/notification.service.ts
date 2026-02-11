/**
 * Notification Service
 * Handles sending notifications to various channels
 */

import axios from 'axios';
import nodemailer from 'nodemailer';
import logger from '../../../utils/logger';
import {
  NotificationConfig,
  TestNotificationResponse,
  SendNotificationResponse,
  NotificationResult
} from '../alerts.types';

/**
 * Send Telegram notification
 */
export async function sendTelegramNotification(
  chatId: string,
  botToken: string,
  message: string
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });

    if (response.data.ok) {
      logger.info(`Telegram notification sent successfully to ${chatId}`);
      return true;
    } else {
      logger.error('Telegram API error:', response.data);
      return false;
    }
  } catch (error: any) {
    logger.error('Failed to send Telegram notification:', error.response?.data || error.message);
    throw new Error(`Telegram error: ${error.response?.data?.description || error.message}`);
  }
}

/**
 * Send Email notification
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST) {
      logger.warn('SMTP not configured, skipping email notification');
      throw new Error('SMTP not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">${subject}</h2>
        <p style="color: #666; line-height: 1.6;">${message}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          This is an automated notification from Nginx + ModSecurity Admin Portal
        </p>
      </div>`,
    });

    logger.info(`Email notification sent successfully to ${to}: ${info.messageId}`);
    return true;
  } catch (error: any) {
    logger.error('Failed to send email notification:', error.message);
    throw new Error(`Email error: ${error.message}`);
  }
}

/**
 * Send Jira notification (create issue or JSM request)
 * Supports Jira Data Center / Server using Personal Access Token (PAT) with Bearer auth
 */
export async function sendJiraNotification(
  config: NotificationConfig,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    if (!config.baseUrl || !config.apiToken) {
      throw new Error('Jira configuration incomplete: baseUrl and apiToken are required');
    }

    const headers = {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const baseUrl = config.baseUrl.replace(/\/+$/, '');

    if (config.jiraType === 'jsm') {
      // Jira Service Management - create customer request
      if (!config.serviceDeskId || !config.requestTypeId) {
        throw new Error('JSM configuration incomplete: serviceDeskId and requestTypeId are required');
      }

      const url = `${baseUrl}/rest/servicedeskapi/request`;
      const body = {
        serviceDeskId: config.serviceDeskId,
        requestTypeId: config.requestTypeId,
        requestFieldValues: {
          summary: subject,
          description: message
        }
      };

      const response = await axios.post(url, body, { headers });
      logger.info(`JSM ticket created successfully: ${response.data.issueKey || response.data.issueId}`);
      return true;
    } else {
      // Jira Data Center / Server - create issue
      if (!config.projectKey) {
        throw new Error('Jira configuration incomplete: projectKey is required');
      }

      const url = `${baseUrl}/rest/api/2/issue`;
      const body = {
        fields: {
          project: { key: config.projectKey },
          summary: subject,
          description: message,
          issuetype: { name: config.issueType || 'Task' }
        }
      };

      const response = await axios.post(url, body, { headers });
      logger.info(`Jira issue created successfully: ${response.data.key}`);
      return true;
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.errors
      ? JSON.stringify(error.response.data.errors)
      : error.response?.data?.errorMessage || error.message;
    logger.error('Failed to send Jira notification:', errorMsg);
    throw new Error(`Jira error: ${errorMsg}`);
  }
}

/**
 * Send test notification based on channel type
 */
export async function sendTestNotification(
  channelName: string,
  channelType: string,
  config: NotificationConfig
): Promise<TestNotificationResponse> {
  const testMessage = `🔔 Test Notification\n\nThis is a test notification from Nginx + ModSecurity Admin Portal.\n\nChannel: ${channelName}\nTime: ${new Date().toLocaleString()}\n\n✅ If you see this message, your notification channel is working correctly!`;

  try {
    if (channelType === 'telegram') {
      if (!config.chatId || !config.botToken) {
        throw new Error('Telegram configuration incomplete: chatId and botToken are required');
      }

      await sendTelegramNotification(
        config.chatId,
        config.botToken,
        testMessage
      );

      return {
        success: true,
        message: `Test notification sent successfully to Telegram chat ${config.chatId}`
      };
    } else if (channelType === 'email') {
      if (!config.email) {
        throw new Error('Email configuration incomplete: email address is required');
      }

      await sendEmailNotification(
        config.email,
        '🔔 Test Notification - Nginx Admin Portal',
        testMessage
      );

      return {
        success: true,
        message: `Test notification sent successfully to ${config.email}`
      };
    } else if (channelType === 'jira') {
      await sendJiraNotification(
        config,
        '🔔 Test Notification - Nginx Admin Portal',
        testMessage
      );

      const target = config.jiraType === 'jsm'
        ? `JSM Service Desk ${config.serviceDeskId}`
        : `Jira project ${config.projectKey}`;

      return {
        success: true,
        message: `Test notification sent successfully to ${target}`
      };
    } else {
      throw new Error(`Unsupported channel type: ${channelType}`);
    }
  } catch (error: any) {
    logger.error(`Failed to send test notification to ${channelName}:`, error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Send alert notification to multiple channels
 */
export async function sendAlertNotification(
  alertName: string,
  alertMessage: string,
  severity: string,
  channels: Array<{ name: string; type: string; config: NotificationConfig }>
): Promise<SendNotificationResponse> {
  const results: NotificationResult[] = [];

  const severityEmoji = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
  const message = `${severityEmoji} ${alertName}\n\nSeverity: ${severity.toUpperCase()}\n\n${alertMessage}\n\nTime: ${new Date().toLocaleString()}`;

  for (const channel of channels) {
    try {
      if (channel.type === 'telegram' && channel.config.chatId && channel.config.botToken) {
        await sendTelegramNotification(
          channel.config.chatId,
          channel.config.botToken,
          message
        );
        results.push({ channel: channel.name, success: true });
      } else if (channel.type === 'email' && channel.config.email) {
        await sendEmailNotification(
          channel.config.email,
          `${severityEmoji} Alert: ${alertName}`,
          message
        );
        results.push({ channel: channel.name, success: true });
      } else if (channel.type === 'jira' && channel.config.baseUrl) {
        await sendJiraNotification(
          channel.config,
          `${severityEmoji} Alert: ${alertName} [${severity.toUpperCase()}]`,
          message
        );
        results.push({ channel: channel.name, success: true });
      } else {
        results.push({
          channel: channel.name,
          success: false,
          error: 'Invalid channel configuration'
        });
      }
    } catch (error: any) {
      results.push({
        channel: channel.name,
        success: false,
        error: error.message
      });
    }
  }

  const allSuccess = results.every(r => r.success);
  return { success: allSuccess, results };
}
