/**
 * Dashboard Analytics Service
 * Handles advanced analytics and statistics from logs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import logger from '../../../utils/logger';
import {
  RequestTrendDataPoint,
  SlowRequestEntry,
  AttackTypeStats,
  LatestAttackEntry,
  IpAnalyticsEntry,
  AttackRatioStats,
  RequestAnalyticsResponse,
} from '../types/dashboard-analytics.types';
import { parseAccessLogLine, parseModSecLogLine } from '../../logs/services/log-parser.service';

const execAsync = promisify(exec);

const NGINX_ACCESS_LOG = '/var/log/nginx/access.log';
const NGINX_ERROR_LOG = '/var/log/nginx/error.log';
const MODSEC_AUDIT_LOG = '/var/log/modsec_audit.log';
const NGINX_LOG_DIR = '/var/log/nginx';
const MAX_BUFFER = 100 * 1024 * 1024; // 100MB
const HOURS_24 = 24 * 3600 * 1000;

export class DashboardAnalyticsService {
  /**
   * Helper: Calculate cutoff time for a given period in hours
   */
  private getCutoffTime(hours: number): number {
    return Date.now() - hours * 3600 * 1000;
  }

  /**
   * Helper: Read ModSecurity logs from a single error log file
   */
  private async readModSecFromFile(filePath: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`grep "ModSecurity:" ${filePath} 2>/dev/null || echo ""`, { maxBuffer: MAX_BUFFER });
      return stdout.trim().split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      logger.warn(`Could not read ModSec logs from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Helper: Read ALL ModSecurity logs from error.log (NO LINE LIMIT!)
   */
  private async readModSecLogs(numLines: number): Promise<string[]> {
    const lines: string[] = [];
    
    // Read from main nginx error.log
    lines.push(...await this.readModSecFromFile(NGINX_ERROR_LOG));
    
    // Read from domain-specific error logs
    try {
      const domainLogs = await this.getDomainLogFiles();
      for (const domainLog of domainLogs) {
        if (domainLog.errorLog) lines.push(...await this.readModSecFromFile(domainLog.errorLog));
        if (domainLog.sslErrorLog) lines.push(...await this.readModSecFromFile(domainLog.sslErrorLog));
      }
    } catch (error) {
      logger.error('Could not read from domain error logs:', error);
    }
    
    return lines;
  }

  /**
   * Helper: Read access logs from all sources (main + domain-specific)
   */
  private async readAllAccessLogs(mainLogLines: number, domainLogLines: number): Promise<string[]> {
    const lines = await this.readLastLines(NGINX_ACCESS_LOG, mainLogLines);
    
    const domainLogs = await this.getDomainLogFiles();
    for (const domainLog of domainLogs) {
      if (domainLog.accessLog) lines.push(...await this.readLastLines(domainLog.accessLog, domainLogLines));
      if (domainLog.sslAccessLog) lines.push(...await this.readLastLines(domainLog.sslAccessLog, domainLogLines));
    }
    
    return lines;
  }

  /**
   * Helper: Determine attack type from parsed ModSec log
   */
  private determineAttackType(parsed: any, defaultType: string = 'Unknown Attack'): string {
    // Check tags first
    if (parsed.tags && parsed.tags.length > 0) {
      const meaningfulTag = parsed.tags.find((tag: string) => 
        tag.includes('attack') || tag.includes('injection') || tag.includes('xss') ||
        tag.includes('sqli') || tag.includes('rce') || tag.includes('lfi') || tag.includes('rfi') || tag.includes('anomaly-evaluation')
      );
      if (meaningfulTag) {
        return meaningfulTag.replace(/-/g, ' ').replace(/_/g, ' ').toUpperCase();
      }
    }

    // Check message
    if (parsed.message) {
      const attackTypes: { [key: string]: string } = {
        'SQL Injection': 'SQL Injection',
        'XSS': defaultType === 'Unknown Attack' ? 'Cross-Site Scripting' : 'XSS Attack',
        'RCE': 'Remote Code Execution',
        'LFI': 'Local File Inclusion',
        'RFI': 'Remote File Inclusion',
        'Command Injection': 'Command Injection',
        'Anomaly Evaluation': 'Anomaly Evaluation'
      };
      
      for (const [key, value] of Object.entries(attackTypes)) {
        if (parsed.message.includes(key)) return value;
      }
    }

    return defaultType;
  }

  /**
   * Helper: Increment status code counter
   */
  private incrementStatusCode(dataPoint: RequestTrendDataPoint, status: number): void {
    const statusKey = `status${status}` as keyof RequestTrendDataPoint;
    if (statusKey in dataPoint) {
      (dataPoint[statusKey] as number)++;
    } else {
      dataPoint.statusOther++;
    }
  }

  /**
   * Get request trend data (auto-refresh every 5 seconds)
   * Returns request count grouped by status codes over time
   */
  async getRequestTrend(intervalSeconds: number = 5): Promise<RequestTrendDataPoint[]> {
    try {
      // Get logs from the last 24 hours grouped by time intervals
      const hoursToFetch = 24;
      const dataPoints = Math.floor((hoursToFetch * 3600) / intervalSeconds);
      const now = Date.now();

      // Read access logs from all sources
      const lines = await this.readAllAccessLogs(10000, 5000);

      // Parse logs and group by time intervals
      const intervalMap = new Map<number, RequestTrendDataPoint>();

      lines.forEach((line, index) => {
        const parsed = parseAccessLogLine(line, index);
        if (!parsed) return;

        const timestamp = new Date(parsed.timestamp).getTime();
        const intervalIndex = Math.floor((now - timestamp) / (intervalSeconds * 1000));
        
        if (intervalIndex >= dataPoints || intervalIndex < 0) return;

        const intervalKey = now - (intervalIndex * intervalSeconds * 1000);
        
        if (!intervalMap.has(intervalKey)) {
          intervalMap.set(intervalKey, {
            timestamp: new Date(intervalKey).toISOString(),
            total: 0,
            status200: 0,
            status301: 0,
            status302: 0,
            status400: 0,
            status403: 0,
            status404: 0,
            status500: 0,
            status502: 0,
            status503: 0,
            statusOther: 0,
          });
        }

        const dataPoint = intervalMap.get(intervalKey)!;
        dataPoint.total++;

        // Count by status code
        if (parsed.statusCode) {
          this.incrementStatusCode(dataPoint, parsed.statusCode);
        }
      });

      // Convert to array and sort by timestamp
      const result = Array.from(intervalMap.values())
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return result;
    } catch (error) {
      logger.error('Get request trend error:', error);
      return [];
    }
  }

  /**
   * Get top 10 slow requests from performance monitoring
   */
  async getSlowRequests(limit: number = 10): Promise<SlowRequestEntry[]> {
    try {
      // Get from PerformanceMetric table
      const prisma = (await import('../../../config/database')).default;
      
      const slowRequests = await prisma.performanceMetric.groupBy({
        by: ['domain'],
        _avg: {
          responseTime: true,
        },
        _max: {
          responseTime: true,
        },
        _min: {
          responseTime: true,
        },
        _count: {
          domain: true,
        },
        orderBy: {
          _avg: {
            responseTime: 'desc',
          },
        },
        take: limit,
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 3600 * 1000), // Last 24 hours
          },
        },
      });

      return slowRequests.map(item => ({
        path: item.domain,
        avgResponseTime: item._avg.responseTime || 0,
        maxResponseTime: item._max.responseTime || 0,
        minResponseTime: item._min.responseTime || 0,
        requestCount: item._count.domain,
      }));
    } catch (error) {
      logger.error('Get slow requests error:', error);
      return [];
    }
  }

  /**
   * Get top 5 attack types in last 24 hours
   */
  async getLatestAttacks(limit: number = 5): Promise<AttackTypeStats[]> {
    try {
      // Read ModSecurity logs from error.log and audit log
      const lines = await this.readModSecLogs(5000);
      
      // Parse and group by attack type
      const attackMap = new Map<string, {
        count: number;
        severity: string;
        lastOccurred: string;
        ruleIds: Set<string>;
      }>();

      const cutoffTime = this.getCutoffTime(24);

      lines.forEach((line, index) => {
        const parsed = parseModSecLogLine(line, index);
        if (!parsed || !parsed.ruleId) return;

        const timestamp = new Date(parsed.timestamp).getTime();
        if (timestamp < cutoffTime) return;

        const attackType = this.determineAttackType(parsed);

        if (!attackMap.has(attackType)) {
          attackMap.set(attackType, {
            count: 0,
            severity: parsed.severity || 'MEDIUM',
            lastOccurred: parsed.timestamp,
            ruleIds: new Set(),
          });
        }

        const stats = attackMap.get(attackType)!;
        stats.count++;
        if (parsed.ruleId) stats.ruleIds.add(parsed.ruleId);
        
        // Update last occurred if more recent
        if (new Date(parsed.timestamp) > new Date(stats.lastOccurred)) {
          stats.lastOccurred = parsed.timestamp;
        }
      });

      // Convert to array and sort by count
      const result: AttackTypeStats[] = Array.from(attackMap.entries())
        .map(([attackType, stats]) => ({
          attackType,
          count: stats.count,
          severity: stats.severity,
          lastOccurred: stats.lastOccurred,
          timestamp: stats.lastOccurred,
          ruleIds: Array.from(stats.ruleIds),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return result;
    } catch (error) {
      logger.error('Get latest attacks error:', error);
      return [];
    }
  }

  /**
   * Get latest security news/events (table format)
   */
  async getLatestNews(limit: number = 20): Promise<LatestAttackEntry[]> {
    try {
      // Read ModSecurity logs from error logs only (not audit log - different format)
      const lines = await this.readModSecLogs(2000);
      
      const attacks: LatestAttackEntry[] = [];
      const cutoffTime = this.getCutoffTime(24);

      lines.forEach((line, index) => {
        const parsed = parseModSecLogLine(line, index);
        if (!parsed) return;

        const timestamp = new Date(parsed.timestamp).getTime();
        if (timestamp < cutoffTime) return;

        const attackerIp = parsed.ip || 'Unknown';
        const domain = parsed.hostname;
        const attackType = this.determineAttackType(parsed, 'Security Event');

        // Use ruleId as logId for better searching
        const logId = parsed.ruleId || parsed.uniqueId || parsed.id;

        attacks.push({
          id: parsed.id,
          timestamp: parsed.timestamp,
          attackerIp,
          domain,
          urlPath: parsed.path || parsed.uri || '/',
          attackType,
          ruleId: parsed.ruleId,
          uniqueId: parsed.uniqueId, // Add uniqueId for precise log lookup
          severity: parsed.severity,
          action: 'Blocked',
          logId,
          // DEBUG: Add raw log sample for first few entries
          ...(index < 3 ? { _debugRawLog: line.substring(0, 300) } : {}),
        } as any);
      });

      // Sort by timestamp descending and limit
      return attacks
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Get latest news error:', error);
      return [];
    }
  }

  /**
   * Get request analytics (top IPs by period)
   */
  async getRequestAnalytics(period: 'day' | 'week' | 'month' = 'day'): Promise<RequestAnalyticsResponse> {
    try {
      const periodHours = period === 'day' ? 24 : period === 'week' ? 168 : 720;
      const cutoffTime = this.getCutoffTime(periodHours);

      // Read access logs from all sources
      const lines = await this.readAllAccessLogs(20000, 10000);

      // Group by IP
      const ipMap = new Map<string, IpAnalyticsEntry>();

      lines.forEach((line, index) => {
        const parsed = parseAccessLogLine(line, index);
        if (!parsed || !parsed.ip) return;

        const timestamp = new Date(parsed.timestamp).getTime();
        if (timestamp < cutoffTime) return;

        if (!ipMap.has(parsed.ip)) {
          ipMap.set(parsed.ip, {
            ip: parsed.ip,
            requestCount: 0,
            errorCount: 0,
            attackCount: 0,
            lastSeen: parsed.timestamp,
          });
        }

        const entry = ipMap.get(parsed.ip)!;
        entry.requestCount++;
        
        if (parsed.statusCode && parsed.statusCode >= 400) {
          entry.errorCount++;
        }

        // Update last seen
        if (new Date(parsed.timestamp) > new Date(entry.lastSeen)) {
          entry.lastSeen = parsed.timestamp;
        }
      });

      // Check for attacks from ModSecurity logs - count by actual client IP
      let modsecLines: string[] = [];
      try {
        modsecLines = await this.readModSecLogs(10000);
      } catch (error) {
        logger.error('Failed to read ModSec logs:', error);
      }
      
      modsecLines.forEach((line, index) => {
        const parsed = parseModSecLogLine(line, index);
        if (!parsed) return;
        
        const timestamp = new Date(parsed.timestamp).getTime();
        if (timestamp < cutoffTime) return;

        // Use parsed IP (already extracted correctly from [client IP])
        const attackerIp = parsed.ip;
        if (!attackerIp) return;

        // If IP exists in map, increment attack count
        let entry = ipMap.get(attackerIp);
        if (entry) {
          entry.attackCount++;
          entry.requestCount++; // Attacks are also requests!
        } else {
          // Create new entry for this IP if not exists
          ipMap.set(attackerIp, {
            ip: attackerIp,
            requestCount: 1, // Attack is a request
            errorCount: 1, // Attack is also an error
            attackCount: 1,
            lastSeen: parsed.timestamp,
          });
        }
      });

      // Sort by request count and get top 10
      const topIps = Array.from(ipMap.values())
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 10);

      return {
        period,
        topIps,
        totalRequests: lines.length,
        uniqueIps: ipMap.size,
        _timestamp: Date.now(), // Force cache refresh
      } as any;
    } catch (error) {
      logger.error('Get request analytics error:', error);
      return {
        period,
        topIps: [],
        totalRequests: 0,
        uniqueIps: 0,
      };
    }
  }

  /**
   * Get attack vs normal request ratio
   */
  async getAttackRatio(): Promise<AttackRatioStats> {
    try {
      // Count total requests from access logs (last 24h)
      const accessLines = await this.readAllAccessLogs(20000, 10000);
      const cutoffTime = this.getCutoffTime(24);
      let totalRequests = 0;

      accessLines.forEach((line, index) => {
        const parsed = parseAccessLogLine(line, index);
        if (!parsed) return;
        
        const timestamp = new Date(parsed.timestamp).getTime();
        if (timestamp >= cutoffTime) {
          totalRequests++;
        }
      });

      // Count attack requests from ModSecurity logs
      const modsecLines = await this.readModSecLogs(5000);
      let attackRequests = 0;

      modsecLines.forEach((line, index) => {
        const parsed = parseModSecLogLine(line, index);
        if (!parsed) return;

        const timestamp = new Date(parsed.timestamp).getTime();
        if (timestamp >= cutoffTime) {
          attackRequests++;
        }
      });

      const normalRequests = totalRequests - attackRequests;
      const attackPercentage = totalRequests > 0 ? (attackRequests / totalRequests) * 100 : 0;

      return {
        totalRequests,
        attackRequests,
        normalRequests,
        attackPercentage: parseFloat(attackPercentage.toFixed(2)),
      };
    } catch (error) {
      logger.error('Get attack ratio error:', error);
      return {
        totalRequests: 0,
        attackRequests: 0,
        normalRequests: 0,
        attackPercentage: 0,
      };
    }
  }

  /**
   * Helper: Read last N lines from file
   */
  private async readLastLines(filePath: string, numLines: number): Promise<string[]> {
    try {
      await fs.access(filePath);
      const { stdout } = await execAsync(`tail -n ${numLines} ${filePath} 2>/dev/null || echo ""`);
      return stdout.trim().split('\n').filter((line: string) => line.trim().length > 0);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        logger.warn(`Could not read log file ${filePath}:`, error);
      }
      return [];
    }
  }

  /**
   * Helper: Get domain-specific log files
   */
  private async getDomainLogFiles(): Promise<{ domain: string; accessLog: string; errorLog: string; sslAccessLog: string; sslErrorLog: string }[]> {
    try {
      const files = await fs.readdir(NGINX_LOG_DIR);
      const domainLogs: { [key: string]: { accessLog?: string; errorLog?: string; sslAccessLog?: string; sslErrorLog?: string } } = {};

      files.forEach(file => {
        const sslAccessMatch = file.match(/^(.+?)[-_]ssl[-_]access\.log$/);
        const sslErrorMatch = file.match(/^(.+?)[-_]ssl[-_]error\.log$/);
        const accessMatch = !file.includes('ssl') && file.match(/^(.+?)[-_]access\.log$/);
        const errorMatch = !file.includes('ssl') && file.match(/^(.+?)[-_]error\.log$/);

        if (sslAccessMatch) {
          const domain = sslAccessMatch[1];
          if (!domainLogs[domain]) domainLogs[domain] = {};
          domainLogs[domain].sslAccessLog = `${NGINX_LOG_DIR}/${file}`;
        } else if (sslErrorMatch) {
          const domain = sslErrorMatch[1];
          if (!domainLogs[domain]) domainLogs[domain] = {};
          domainLogs[domain].sslErrorLog = `${NGINX_LOG_DIR}/${file}`;
        } else if (accessMatch) {
          const domain = accessMatch[1];
          if (!domainLogs[domain]) domainLogs[domain] = {};
          domainLogs[domain].accessLog = `${NGINX_LOG_DIR}/${file}`;
        } else if (errorMatch) {
          const domain = errorMatch[1];
          if (!domainLogs[domain]) domainLogs[domain] = {};
          domainLogs[domain].errorLog = `${NGINX_LOG_DIR}/${file}`;
        }
      });

      return Object.entries(domainLogs).map(([domain, logs]) => ({
        domain,
        accessLog: logs.accessLog || '',
        errorLog: logs.errorLog || '',
        sslAccessLog: logs.sslAccessLog || '',
        sslErrorLog: logs.sslErrorLog || '',
      }));
    } catch (error) {
      logger.error('Error reading domain log files:', error);
      return [];
    }
  }
}

// Export singleton instance
export const dashboardAnalyticsService = new DashboardAnalyticsService();
