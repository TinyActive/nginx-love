/**
 * Alert Monitoring Service
 * Monitors system metrics and triggers alerts based on rules
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../../../utils/logger';
import prisma from '../../../config/database';
import { TIMEOUTS } from '../../../shared/constants/timeouts.constants';
import { sendAlertNotification } from './notification.service';
import {
  SystemMetrics,
  UpstreamStatus,
  SSLCertificateInfo,
  ConditionEvaluation
} from '../alerts.types';

const execAsync = promisify(exec);

// Store last alert time to prevent spam
const lastAlertTime: Map<string, number> = new Map();

// Store last check time for each rule
const lastCheckTime: Map<string, number> = new Map();

/**
 * Get current system metrics
 */
async function getSystemMetrics(): Promise<SystemMetrics> {
  // CPU Usage
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });

  const cpuUsage = 100 - (100 * totalIdle / totalTick);

  // Memory Usage
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsage = ((totalMem - freeMem) / totalMem) * 100;

  // Disk Usage (for root partition)
  let diskUsage = 0;
  try {
    const { stdout } = await execAsync("df / | tail -1 | awk '{print $5}' | sed 's/%//'");
    diskUsage = parseFloat(stdout.trim());
  } catch (error) {
    logger.error('Failed to get disk usage:', error);
  }

  return {
    cpu: Math.round(cpuUsage * 10) / 10,
    memory: Math.round(memUsage * 10) / 10,
    disk: diskUsage
  };
}

/**
 * Check upstream health
 */
async function checkUpstreamHealth(): Promise<UpstreamStatus[]> {
  const statuses: UpstreamStatus[] = [];

  try {
    // Get all domains with upstreams
    const domains = await prisma.domain.findMany({
      include: {
        upstreams: true
      }
    });

    for (const domain of domains) {
      if (domain.upstreams && domain.upstreams.length > 0) {
        for (const upstream of domain.upstreams) {
          try {
            const url = `http://${upstream.host}:${upstream.port}`;
            const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" --max-time 5 ${url}`, {
              timeout: 6000
            });
            const httpCode = parseInt(stdout.trim());

            statuses.push({
              name: `${domain.name} -> ${upstream.host}:${upstream.port}`,
              status: (httpCode >= 200 && httpCode < 500) ? 'up' : 'down'
            });
          } catch (error) {
            statuses.push({
              name: `${domain.name} -> ${upstream.host}:${upstream.port}`,
              status: 'down'
            });
          }
        }
      }
    }
  } catch (error) {
    logger.error('Failed to check upstream health:', error);
  }

  return statuses;
}

/**
 * Check SSL certificate expiry
 */
async function checkSSLCertificates(): Promise<SSLCertificateInfo[]> {
  const certInfo: SSLCertificateInfo[] = [];

  try {
    const domains = await prisma.domain.findMany({
      where: {
        sslEnabled: true
      }
    });

    for (const domain of domains) {
      try {
        const sslDir = process.env.SSL_DIR || '/etc/nginx/ssl';
        const certPath = path.join(sslDir, domain.name, 'fullchain.pem');

        if (fs.existsSync(certPath)) {
          const { stdout } = await execAsync(`openssl x509 -enddate -noout -in ${certPath}`);
          const endDateStr = stdout.match(/notAfter=(.+)/)?.[1];

          if (endDateStr) {
            const endDate = new Date(endDateStr);
            const now = new Date();
            const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            certInfo.push({
              domain: domain.name,
              daysRemaining
            });
          }
        }
      } catch (error) {
        logger.error(`Failed to check SSL for ${domain.name}:`, error);
      }
    }
  } catch (error) {
    logger.error('Failed to check SSL certificates:', error);
  }

  return certInfo;
}

/**
 * Evaluate alert rule condition
 */
function evaluateCondition(
  condition: string,
  threshold: number,
  metrics: SystemMetrics,
  upstreams: UpstreamStatus[],
  sslCerts: SSLCertificateInfo[]
): ConditionEvaluation {
  try {
    // CPU Alert: cpu > threshold
    if (condition.includes('cpu') && condition.includes('threshold')) {
      const triggered = metrics.cpu > threshold;
      return {
        triggered,
        details: `Current CPU usage: ${metrics.cpu}% (threshold: ${threshold}%)`
      };
    }

    // Memory Alert: memory > threshold
    if (condition.includes('memory') && condition.includes('threshold')) {
      const triggered = metrics.memory > threshold;
      return {
        triggered,
        details: `Current memory usage: ${metrics.memory}% (threshold: ${threshold}%)`
      };
    }

    // Disk Alert: disk > threshold
    if (condition.includes('disk') && condition.includes('threshold')) {
      const triggered = metrics.disk > threshold;
      return {
        triggered,
        details: `Current disk usage: ${metrics.disk}% (threshold: ${threshold}%)`
      };
    }

    // Upstream/Backend Down: upstream_status == down OR http_status == 0
    if (condition.includes('upstream_status') || condition.includes('http_status')) {
      const downUpstreams = upstreams.filter(u => u.status === 'down');
      const triggered = downUpstreams.length >= threshold;
      return {
        triggered,
        details: triggered
          ? `Backends down: ${downUpstreams.map(u => u.name).join(', ')}`
          : 'All backends are healthy'
      };
    }

    // SSL Expiring: ssl_days_remaining < threshold
    if (condition.includes('ssl_days_remaining') && condition.includes('threshold')) {
      const expiringSoon = sslCerts.filter(cert => cert.daysRemaining < threshold);
      const triggered = expiringSoon.length > 0;
      return {
        triggered,
        details: triggered
          ? `SSL certificates expiring soon:\n${expiringSoon.map(c => `- ${c.domain}: ${c.daysRemaining} days remaining`).join('\n')}`
          : 'All SSL certificates are valid'
      };
    }

    return { triggered: false, details: 'Unknown condition' };
  } catch (error) {
    logger.error('Failed to evaluate condition:', error);
    return { triggered: false, details: 'Error evaluating condition' };
  }
}

/**
 * Get cooldown period based on alert condition
 */
function getCooldownPeriod(condition: string): number {
  // SSL alerts use 1 day cooldown
  if (condition.includes('ssl_days_remaining')) {
    return TIMEOUTS.ALERT_COOLDOWN_SSL;
  }
  // All other alerts use 5 minute cooldown
  return TIMEOUTS.ALERT_COOLDOWN_DEFAULT;
}

/**
 * Check if alert is in cooldown period
 */
function isInCooldown(ruleId: string, condition: string): boolean {
  const lastTime = lastAlertTime.get(ruleId);
  if (!lastTime) return false;

  const now = Date.now();
  const cooldownPeriod = getCooldownPeriod(condition);
  return (now - lastTime) < cooldownPeriod;
}

/**
 * Update last alert time
 */
function updateAlertTime(ruleId: string): void {
  lastAlertTime.set(ruleId, Date.now());
}

/**
 * Check if rule should be checked based on its interval
 */
function shouldCheckRule(ruleId: string, checkInterval: number): boolean {
  const lastTime = lastCheckTime.get(ruleId);
  if (!lastTime) return true; // First check

  const now = Date.now();
  const elapsed = now - lastTime;
  return elapsed >= (checkInterval * 1000);
}

/**
 * Update last check time
 */
function updateCheckTime(ruleId: string): void {
  lastCheckTime.set(ruleId, Date.now());
}

/**
 * Run alert monitoring cycle
 */
export async function runAlertMonitoring(): Promise<void> {
  try {
    logger.info('🔍 Running alert monitoring cycle...');

    // Get system metrics
    const metrics = await getSystemMetrics();
    logger.info(`📊 System Metrics - CPU: ${metrics.cpu}%, Memory: ${metrics.memory}%, Disk: ${metrics.disk}%`);

    // Check upstream health
    const upstreams = await checkUpstreamHealth();
    const downCount = upstreams.filter(u => u.status === 'down').length;
    logger.info(`🌐 Upstreams - Total: ${upstreams.length}, Down: ${downCount}`);

    // Check SSL certificates
    const sslCerts = await checkSSLCertificates();
    const expiringCount = sslCerts.filter(c => c.daysRemaining < 30).length;
    logger.info(`🔒 SSL Certificates - Total: ${sslCerts.length}, Expiring soon: ${expiringCount}`);

    // Get all enabled alert rules
    const rules = await prisma.alertRule.findMany({
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
    });

    logger.info(`📋 Checking ${rules.length} enabled alert rules...`);

    // Evaluate each rule
    for (const rule of rules) {
      // Check if rule should be checked based on its interval
      if (!shouldCheckRule(rule.id, rule.checkInterval)) {
        logger.debug(`⏭️  Rule "${rule.name}" - not time yet (interval: ${rule.checkInterval}s)`);
        continue;
      }

      // Update last check time
      updateCheckTime(rule.id);

      // Skip if in cooldown
      if (isInCooldown(rule.id, rule.condition)) {
        const cooldown = getCooldownPeriod(rule.condition);
        const cooldownMinutes = cooldown / (60 * 1000);
        logger.debug(`⏱️  Rule "${rule.name}" in cooldown (${cooldownMinutes} min), skipping...`);
        continue;
      }

      // Evaluate condition
      const evaluation = evaluateCondition(
        rule.condition,
        rule.threshold,
        metrics,
        upstreams,
        sslCerts
      );

      if (evaluation.triggered) {
        logger.warn(`🚨 Alert triggered: ${rule.name}`);
        logger.warn(`   Details: ${evaluation.details}`);

        // Get enabled channels
        const enabledChannels = rule.channels
          .filter((rc: any) => rc.channel.enabled)
          .map((rc: any) => ({
            name: rc.channel.name,
            type: rc.channel.type,
            config: rc.channel.config as any
          }));

        if (enabledChannels.length > 0) {
          // Send notifications
          const result = await sendAlertNotification(
            rule.name,
            evaluation.details,
            rule.severity,
            enabledChannels
          );

          logger.info(`📨 Notification sent to ${enabledChannels.length} channels`);
          logger.info(`   Results: ${JSON.stringify(result.results)}`);

          // Update cooldown
          updateAlertTime(rule.id);
        } else {
          logger.warn(`   No enabled channels for rule "${rule.name}"`);
        }
      } else {
        logger.debug(`✅ Rule "${rule.name}" - OK (${evaluation.details})`);
      }
    }

    logger.info('✅ Alert monitoring cycle completed\n');
  } catch (error) {
    logger.error('❌ Alert monitoring error:', error);
  }
}

/**
 * Start alert monitoring with interval
 * Global check interval - will check which rules need to run based on their individual checkInterval
 * @param intervalSeconds - Global scan interval in seconds (default: 10)
 */
export function startAlertMonitoring(intervalSeconds: number = 10): NodeJS.Timeout {
  logger.info(`🚀 Starting alert monitoring service (global scan: every ${intervalSeconds} second(s))`);
  logger.info(`   Each alert rule has its own check interval configured separately`);

  // Run immediately on start
  runAlertMonitoring();

  // Then run at intervals
  return setInterval(() => {
    runAlertMonitoring();
  }, intervalSeconds * 1000);
}

/**
 * Stop alert monitoring
 */
export function stopAlertMonitoring(timerId: NodeJS.Timeout): void {
  clearInterval(timerId);
  logger.info('🛑 Alert monitoring service stopped');
}
