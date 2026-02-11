/**
 * Alert domain type definitions
 */

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
}

export interface UpstreamStatus {
  name: string;
  status: 'up' | 'down';
}

export interface SSLCertificateInfo {
  domain: string;
  daysRemaining: number;
}

export interface NotificationConfig {
  email?: string;
  chatId?: string;
  botToken?: string;
  // Jira / JSM configuration (Data Center / Server only, uses PAT with Bearer auth)
  jiraType?: 'jira' | 'jsm';
  baseUrl?: string;
  apiToken?: string;
  projectKey?: string;
  issueType?: string;
  serviceDeskId?: string;
  requestTypeId?: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: NotificationConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: string;
  enabled: boolean;
  checkInterval: number;
  channels: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertRuleWithChannels extends Omit<AlertRule, 'channels'> {
  channels: Array<{
    id: string;
    ruleId: string;
    channelId: string;
    channel: NotificationChannel;
  }>;
}

export interface ConditionEvaluation {
  triggered: boolean;
  details: string;
}

export interface NotificationResult {
  channel: string;
  success: boolean;
  error?: string;
}

export interface SendNotificationResponse {
  success: boolean;
  results: NotificationResult[];
}

export interface TestNotificationResponse {
  success: boolean;
  message: string;
}

export type NotificationChannelType = 'email' | 'telegram' | 'jira';
export type AlertSeverity = 'info' | 'warning' | 'critical';
