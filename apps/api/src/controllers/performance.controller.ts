import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import prisma from '../config/database';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface NginxLogEntry {
  timestamp: Date;
  domain: string;
  statusCode: number;
  responseTime: number;
  requestMethod: string;
  requestPath: string;
}

/**
 * Parse Nginx access log line
 * Current format: $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" "$http_x_forwarded_for"
 * Note: Since request_time is not in current log format, we estimate based on status code
 */
const parseNginxLogLine = (line: string, domain: string): NginxLogEntry | null => {
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
const collectMetricsFromLogs = async (domain?: string, minutes: number = 60): Promise<NginxLogEntry[]> => {
  try {
    const logDir = '/var/log/nginx';
    logger.info(`[Performance Controller] Collecting metrics from log directory: ${logDir}`);
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
      
      logger.info(`[Performance Controller] Checking for log files: ${sslLogFile}, ${httpLogFile}`);
      
      let logFile: string | null = null;
      if (fs.existsSync(sslLogFile)) {
        logFile = sslLogFile;
        logger.info(`[Performance Controller] Using SSL log file: ${logFile}`);
      } else if (fs.existsSync(httpLogFile)) {
        logFile = httpLogFile;
        logger.info(`[Performance Controller] Using HTTP log file: ${logFile}`);
      }
      
      if (!logFile) {
        logger.warn(`[Performance Controller] Log file not found for domain: ${domainName}`);
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
const calculateMetrics = (entries: NginxLogEntry[], intervalMinutes: number = 5): any[] => {
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

/**
 * Get performance metrics
 * GET /api/performance/metrics?domain=example.com&timeRange=1h
 */
export const getPerformanceMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { domain = 'all', timeRange = '1h' } = req.query;
    logger.info(`[Performance Controller] Fetching metrics for domain: ${domain}, timeRange: ${timeRange}`);

    // Parse timeRange to minutes
    const timeRangeMap: { [key: string]: number } = {
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '6h': 360,
      '24h': 1440
    };
    const minutes = timeRangeMap[timeRange as string] || 60;

    // Collect and calculate metrics from logs
    logger.info(`[Performance Controller] Collecting metrics from logs for ${minutes} minutes`);
    const logEntries = await collectMetricsFromLogs(domain as string, minutes);
    logger.info(`[Performance Controller] Collected ${logEntries.length} log entries`);
    const metrics = calculateMetrics(logEntries, 5); // 5-minute intervals
    logger.info(`[Performance Controller] Calculated ${metrics.length} metrics`);

    // Also save recent metrics to database for historical tracking
    if (metrics.length > 0) {
      const latestMetrics = metrics.slice(0, 5); // Save last 5 intervals
      for (const metric of latestMetrics) {
        try {
          await prisma.performanceMetric.create({
            data: {
              domain: metric.domain,
              timestamp: metric.timestamp,
              responseTime: metric.responseTime,
              throughput: metric.throughput,
              errorRate: metric.errorRate,
              requestCount: metric.requestCount
            }
          });
        } catch (error) {
          // Ignore duplicate entries
          if (!(error as any).code?.includes('P2002')) {
            logger.error('Failed to save metric to database:', error);
          }
        }
      }
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get performance statistics
 * GET /api/performance/stats?domain=example.com&timeRange=1h
 */
export const getPerformanceStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { domain = 'all', timeRange = '1h' } = req.query;
    logger.info(`[Performance Controller] Fetching stats for domain: ${domain}, timeRange: ${timeRange}`);

    // Parse timeRange
    const timeRangeMap: { [key: string]: number } = {
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '6h': 360,
      '24h': 1440
    };
    const minutes = timeRangeMap[timeRange as string] || 60;

    // Collect metrics from logs
    logger.info(`[Performance Controller] Collecting metrics from logs for ${minutes} minutes`);
    const logEntries = await collectMetricsFromLogs(domain as string, minutes);
    logger.info(`[Performance Controller] Collected ${logEntries.length} log entries`);
    const metrics = calculateMetrics(logEntries, 5);
    logger.info(`[Performance Controller] Calculated ${metrics.length} metrics`);

    if (metrics.length === 0) {
      res.json({
        success: true,
        data: {
          avgResponseTime: 0,
          avgThroughput: 0,
          avgErrorRate: 0,
          totalRequests: 0,
          slowRequests: [],
          highErrorPeriods: []
        }
      });
      return;
    }

    // Calculate aggregated stats
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const avgThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length;
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);

    // Find slow requests (> 200ms)
    const slowRequests = metrics
      .filter(m => m.responseTime > 200)
      .slice(0, 5)
      .map(m => ({
        domain: m.domain,
        timestamp: m.timestamp,
        responseTime: m.responseTime
      }));

    // Find high error periods (> 3%)
    const highErrorPeriods = metrics
      .filter(m => m.errorRate > 3)
      .slice(0, 5)
      .map(m => ({
        domain: m.domain,
        timestamp: m.timestamp,
        errorRate: m.errorRate
      }));

    res.json({
      success: true,
      data: {
        avgResponseTime,
        avgThroughput,
        avgErrorRate,
        totalRequests,
        slowRequests,
        highErrorPeriods
      }
    });
  } catch (error) {
    logger.error('Get performance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get historical metrics from database
 * GET /api/performance/history?domain=example.com&limit=100
 */
export const getPerformanceHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { domain = 'all', limit = '100' } = req.query;

    const whereClause = domain === 'all' ? {} : { domain: domain as string };

    const metrics = await prisma.performanceMetric.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc'
      },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Get performance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Clean old metrics from database
 * DELETE /api/performance/cleanup?days=7
 */
export const cleanupOldMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { days = '7' } = req.query;
    const cutoffDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

    const result = await prisma.performanceMetric.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${result.count} old performance metrics`);

    res.json({
      success: true,
      message: `Deleted ${result.count} old metrics`,
      data: { deletedCount: result.count }
    });
  } catch (error) {
    logger.error('Cleanup old metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
