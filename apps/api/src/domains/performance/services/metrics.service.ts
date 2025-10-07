/**
 * Metrics Service
 *
 * Handles log parsing, metrics collection, and calculation logic
 * for performance monitoring.
 */

import * as fs from 'fs';
import * as path from 'path';
import logger from '../../../utils/logger';
import prisma from '../../../config/database';
import { NginxLogEntry, PerformanceMetrics, MetricsCollectionOptions } from '../performance.types';

/**
 * Parse a single Nginx access log line
 *
 * Current format: $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" "$http_x_forwarded_for"
 * Note: Since request_time is not in current log format, we estimate based on status code
 */
export const parseNginxLogLine = (line: string, domain: string): NginxLogEntry | null => {
  try {
    // Regex for current Nginx log format (without request_time)
    const regex = /^([\d\.]+) - ([\w-]+) \[(.*?)\] "(.*?)" (\d+) (\d+) "(.*?)" "(.*?)" "(.*?)"$/;
    const match = line.match(regex);

    if (!match) return null;

    const [, , , timeLocal, request, status, bodyBytes] = match;

    // Parse request method and path
    const requestParts = request.split(' ');
    const requestMethod = requestParts[0] || 'GET';
    const requestPath = requestParts[1] || '/';

    // Parse timestamp
    const timestamp = new Date(timeLocal.replace(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/, '$2 $1 $3 $4:$5:$6'));

    // Estimate response time based on status code and body size
    const statusCode = parseInt(status);
    const bytes = parseInt(bodyBytes) || 0;
    let estimatedResponseTime = 50; // Base time in ms

    // Adjust based on status code
    if (statusCode >= 500) {
      estimatedResponseTime += 200; // Server errors take longer
    } else if (statusCode >= 400) {
      estimatedResponseTime += 50; // Client errors
    } else if (statusCode === 304) {
      estimatedResponseTime = 20; // Not modified - very fast
    } else if (statusCode === 200) {
      // Estimate based on response size (rough approximation)
      estimatedResponseTime += Math.min(bytes / 10000, 500); // Max 500ms for large responses
    }

    return {
      timestamp,
      domain,
      statusCode,
      responseTime: estimatedResponseTime,
      requestMethod,
      requestPath
    };
  } catch (error) {
    logger.error(`Failed to parse log line: ${line}`, error);
    return null;
  }
};

/**
 * Collect metrics from Nginx access logs
 */
export const collectMetricsFromLogs = async (options: MetricsCollectionOptions): Promise<NginxLogEntry[]> => {
  const { domain, minutes } = options;

  try {
    const logDir = '/var/log/nginx';
    logger.info(`[Metrics Service] Collecting metrics from log directory: ${logDir}`);
    const entries: NginxLogEntry[] = [];
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

    // Get list of domains if not specified
    let domains: string[] = [];
    if (domain && domain !== 'all') {
      domains = [domain];
    } else {
      const dbDomains = await prisma.domain.findMany({ select: { name: true } });
      domains = dbDomains.map(d => d.name);
    }

    // Read logs for each domain
    for (const domainName of domains) {
      // Try SSL log file first, then fall back to HTTP log file
      const sslLogFile = path.join(logDir, `${domainName}_ssl_access.log`);
      const httpLogFile = path.join(logDir, `${domainName}_access.log`);

      logger.info(`[Metrics Service] Checking for log files: ${sslLogFile}, ${httpLogFile}`);

      let logFile: string | null = null;
      if (fs.existsSync(sslLogFile)) {
        logFile = sslLogFile;
        logger.info(`[Metrics Service] Using SSL log file: ${logFile}`);
      } else if (fs.existsSync(httpLogFile)) {
        logFile = httpLogFile;
        logger.info(`[Metrics Service] Using HTTP log file: ${logFile}`);
      }

      if (!logFile) {
        logger.warn(`[Metrics Service] Log file not found for domain: ${domainName}`);
        continue;
      }

      try {
        const logContent = fs.readFileSync(logFile, 'utf-8');
        const lines = logContent.split('\n').filter(line => line.trim());

        for (const line of lines) {
          const entry = parseNginxLogLine(line, domainName);
          if (entry && entry.timestamp >= cutoffTime) {
            entries.push(entry);
          }
        }
      } catch (error) {
        logger.error(`Failed to read log file ${logFile}:`, error);
      }
    }

    return entries;
  } catch (error) {
    logger.error('Failed to collect metrics from logs:', error);
    return [];
  }
};

/**
 * Calculate aggregated metrics from log entries
 */
export const calculateMetrics = (entries: NginxLogEntry[], intervalMinutes: number = 5): PerformanceMetrics[] => {
  if (entries.length === 0) return [];

  // Group entries by domain and time interval
  const metricsMap = new Map<string, any>();

  entries.forEach(entry => {
    // Round timestamp to interval
    const intervalMs = intervalMinutes * 60 * 1000;
    const roundedTime = new Date(Math.floor(entry.timestamp.getTime() / intervalMs) * intervalMs);
    const key = `${entry.domain}-${roundedTime.toISOString()}`;

    if (!metricsMap.has(key)) {
      metricsMap.set(key, {
        domain: entry.domain,
        timestamp: roundedTime,
        responseTimes: [],
        totalRequests: 0,
        errorCount: 0
      });
    }

    const metric = metricsMap.get(key);
    metric.responseTimes.push(entry.responseTime);
    metric.totalRequests += 1;
    if (entry.statusCode >= 400) {
      metric.errorCount += 1;
    }
  });

  // Calculate final metrics
  const results = Array.from(metricsMap.values()).map(metric => {
    const avgResponseTime = metric.responseTimes.reduce((sum: number, t: number) => sum + t, 0) / metric.responseTimes.length;
    const errorRate = (metric.errorCount / metric.totalRequests) * 100;
    const throughput = metric.totalRequests / intervalMinutes / 60; // requests per second

    return {
      domain: metric.domain,
      timestamp: metric.timestamp,
      responseTime: avgResponseTime,
      throughput: throughput,
      errorRate: errorRate,
      requestCount: metric.totalRequests
    };
  });

  return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};
