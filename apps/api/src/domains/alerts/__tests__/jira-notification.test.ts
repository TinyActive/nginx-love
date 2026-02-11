/**
 * Jira Notification Service Tests
 * Tests for Jira Data Center / Server integration using PAT (Bearer auth)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before importing the module
vi.mock('axios', () => ({
  default: {
    post: vi.fn()
  }
}));

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn()
    }))
  }
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

import axios from 'axios';
import {
  sendJiraNotification,
  sendTestNotification,
  sendAlertNotification
} from '../services/notification.service';
import { NotificationConfig } from '../alerts.types';

describe('Jira Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendJiraNotification', () => {
    it('should create a Jira issue successfully', async () => {
      const config: NotificationConfig = {
        jiraType: 'jira',
        baseUrl: 'https://jira.company.com',
        apiToken: 'test-pat-token',
        projectKey: 'OPS',
        issueType: 'Task'
      };

      (axios.post as any).mockResolvedValueOnce({
        data: { key: 'OPS-123' }
      });

      const result = await sendJiraNotification(config, 'Test Subject', 'Test message');

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://jira.company.com/rest/api/2/issue',
        expect.objectContaining({
          fields: expect.objectContaining({
            project: { key: 'OPS' },
            summary: 'Test Subject',
            issuetype: { name: 'Task' }
          })
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-pat-token',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should create a JSM service request successfully', async () => {
      const config: NotificationConfig = {
        jiraType: 'jsm',
        baseUrl: 'https://jira.company.com',
        apiToken: 'test-pat-token',
        serviceDeskId: '1',
        requestTypeId: '10'
      };

      (axios.post as any).mockResolvedValueOnce({
        data: { issueKey: 'SD-456' }
      });

      const result = await sendJiraNotification(config, 'Test Subject', 'Test message');

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://jira.company.com/rest/servicedeskapi/request',
        expect.objectContaining({
          serviceDeskId: '1',
          requestTypeId: '10',
          requestFieldValues: {
            summary: 'Test Subject',
            description: 'Test message'
          }
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-pat-token',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should use default issue type "Task" when not specified', async () => {
      const config: NotificationConfig = {
        jiraType: 'jira',
        baseUrl: 'https://jira.company.com',
        apiToken: 'test-pat-token',
        projectKey: 'OPS'
      };

      (axios.post as any).mockResolvedValueOnce({
        data: { key: 'OPS-124' }
      });

      await sendJiraNotification(config, 'Test', 'Message');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          fields: expect.objectContaining({
            issuetype: { name: 'Task' }
          })
        }),
        expect.any(Object)
      );
    });

    it('should throw error when baseUrl is missing', async () => {
      const config: NotificationConfig = {
        jiraType: 'jira',
        apiToken: 'test-pat-token',
        projectKey: 'OPS'
      };

      await expect(sendJiraNotification(config, 'Test', 'Message'))
        .rejects.toThrow('Jira configuration incomplete: baseUrl and apiToken are required');
    });

    it('should throw error when apiToken is missing', async () => {
      const config: NotificationConfig = {
        jiraType: 'jira',
        baseUrl: 'https://jira.company.com',
        projectKey: 'OPS'
      };

      await expect(sendJiraNotification(config, 'Test', 'Message'))
        .rejects.toThrow('Jira configuration incomplete: baseUrl and apiToken are required');
    });

    it('should throw error when projectKey is missing for Jira type', async () => {
      const config: NotificationConfig = {
        jiraType: 'jira',
        baseUrl: 'https://jira.company.com',
        apiToken: 'test-pat-token'
      };

      await expect(sendJiraNotification(config, 'Test', 'Message'))
        .rejects.toThrow('Jira configuration incomplete: projectKey is required');
    });

    it('should throw error when serviceDeskId is missing for JSM type', async () => {
      const config: NotificationConfig = {
        jiraType: 'jsm',
        baseUrl: 'https://jira.company.com',
        apiToken: 'test-pat-token',
        requestTypeId: '10'
      };

      await expect(sendJiraNotification(config, 'Test', 'Message'))
        .rejects.toThrow('JSM configuration incomplete: serviceDeskId and requestTypeId are required');
    });

    it('should handle Jira API errors', async () => {
      const config: NotificationConfig = {
        jiraType: 'jira',
        baseUrl: 'https://jira.company.com',
        apiToken: 'test-pat-token',
        projectKey: 'OPS'
      };

      (axios.post as any).mockRejectedValueOnce({
        response: {
          data: {
            errors: { project: 'Project not found' }
          }
        }
      });

      await expect(sendJiraNotification(config, 'Test', 'Message'))
        .rejects.toThrow('Jira error:');
    });

    it('should strip trailing slashes from baseUrl', async () => {
      const config: NotificationConfig = {
        jiraType: 'jira',
        baseUrl: 'https://jira.company.com///',
        apiToken: 'test-pat-token',
        projectKey: 'OPS'
      };

      (axios.post as any).mockResolvedValueOnce({
        data: { key: 'OPS-125' }
      });

      await sendJiraNotification(config, 'Test', 'Message');

      expect(axios.post).toHaveBeenCalledWith(
        'https://jira.company.com/rest/api/2/issue',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should always use Bearer auth with PAT', async () => {
      const config: NotificationConfig = {
        jiraType: 'jira',
        baseUrl: 'https://jira.company.com',
        apiToken: 'my-secret-pat',
        projectKey: 'OPS'
      };

      (axios.post as any).mockResolvedValueOnce({
        data: { key: 'OPS-126' }
      });

      await sendJiraNotification(config, 'Test', 'Message');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer my-secret-pat'
          })
        })
      );
    });
  });

  describe('sendTestNotification with jira channel', () => {
    it('should send test notification to Jira project', async () => {
      const config: NotificationConfig = {
        jiraType: 'jira',
        baseUrl: 'https://jira.company.com',
        apiToken: 'test-pat-token',
        projectKey: 'OPS'
      };

      (axios.post as any).mockResolvedValueOnce({
        data: { key: 'OPS-127' }
      });

      const result = await sendTestNotification('My Jira Channel', 'jira', config);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Jira project OPS');
    });

    it('should send test notification to JSM service desk', async () => {
      const config: NotificationConfig = {
        jiraType: 'jsm',
        baseUrl: 'https://jira.company.com',
        apiToken: 'test-pat-token',
        serviceDeskId: '1',
        requestTypeId: '10'
      };

      (axios.post as any).mockResolvedValueOnce({
        data: { issueKey: 'SD-100' }
      });

      const result = await sendTestNotification('My JSM Channel', 'jira', config);

      expect(result.success).toBe(true);
      expect(result.message).toContain('JSM Service Desk 1');
    });

    it('should return failure when Jira test notification fails', async () => {
      const config: NotificationConfig = {
        jiraType: 'jira',
        baseUrl: 'https://jira.company.com',
        apiToken: 'invalid-token',
        projectKey: 'OPS'
      };

      (axios.post as any).mockRejectedValueOnce({
        response: {
          data: { errorMessage: 'Unauthorized' }
        }
      });

      const result = await sendTestNotification('My Jira Channel', 'jira', config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Jira error');
    });
  });

  describe('sendAlertNotification with jira channel', () => {
    it('should send alert notification to Jira channel', async () => {
      const channels = [
        {
          name: 'Jira Channel',
          type: 'jira',
          config: {
            jiraType: 'jira' as const,
            baseUrl: 'https://jira.company.com',
            apiToken: 'test-pat-token',
            projectKey: 'OPS'
          }
        }
      ];

      (axios.post as any).mockResolvedValueOnce({
        data: { key: 'OPS-200' }
      });

      const result = await sendAlertNotification(
        'High CPU Alert',
        'CPU usage is at 95%',
        'critical',
        channels
      );

      expect(result.success).toBe(true);
      expect(result.results[0].channel).toBe('Jira Channel');
      expect(result.results[0].success).toBe(true);
    });

    it('should handle mixed channel types including jira', async () => {
      const channels = [
        {
          name: 'Jira Channel',
          type: 'jira',
          config: {
            jiraType: 'jira' as const,
            baseUrl: 'https://jira.company.com',
            apiToken: 'test-pat-token',
            projectKey: 'OPS'
          }
        },
        {
          name: 'Invalid Channel',
          type: 'jira',
          config: {} as NotificationConfig
        }
      ];

      (axios.post as any).mockResolvedValueOnce({
        data: { key: 'OPS-201' }
      });

      const result = await sendAlertNotification(
        'Disk Alert',
        'Disk usage is at 92%',
        'warning',
        channels
      );

      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
    });
  });
});
