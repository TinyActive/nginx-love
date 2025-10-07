import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../../utils/logger';
import prisma from '../../config/database';
import { ParsedLogEntry, LogFilterOptions, LogStatistics } from './logs.types';
import { parseAccessLogLine, parseErrorLogLine, parseModSecLogLine } from './services/log-parser.service';

const NGINX_ACCESS_LOG = '/var/log/nginx/access.log';
const NGINX_ERROR_LOG = '/var/log/nginx/error.log';
const MODSEC_AUDIT_LOG = '/var/log/modsec_audit.log';
const NGINX_LOG_DIR = '/var/log/nginx';

/**
 * Read last N lines from a file efficiently
 */
async function readLastLines(filePath: string, numLines: number): Promise<string[]> {
  try {
    await fs.access(filePath);

    // Use tail command for efficiency with large files
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync(`tail -n ${numLines} ${filePath} 2>/dev/null || echo ""`);
    return stdout.trim().split('\n').filter((line: string) => line.trim().length > 0);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logger.warn(`Log file not found: ${filePath}`);
    } else {
      logger.error(`Error reading log file ${filePath}:`, error);
    }
    return [];
  }
}

/**
 * Get list of domain-specific log files
 */
async function getDomainLogFiles(): Promise<{ domain: string; accessLog: string; errorLog: string; sslAccessLog: string; sslErrorLog: string }[]> {
  try {
    const files = await fs.readdir(NGINX_LOG_DIR);
    const domainLogs: { [key: string]: { accessLog?: string; errorLog?: string; sslAccessLog?: string; sslErrorLog?: string } } = {};

    files.forEach(file => {
      // Match patterns for both HTTP and HTTPS logs:
      // - example.com_access.log or example.com-access.log (HTTP)
      // - example.com_error.log or example.com-error.log (HTTP)
      // - example.com_ssl_access.log or example.com-ssl-access.log (HTTPS)
      // - example.com_ssl_error.log or example.com-ssl-error.log (HTTPS)

      // SSL access log
      const sslAccessMatch = file.match(/^(.+?)[-_]ssl[-_]access\.log$/);
      // SSL error log
      const sslErrorMatch = file.match(/^(.+?)[-_]ssl[-_]error\.log$/);
      // Non-SSL access log (must not contain 'ssl')
      const accessMatch = !file.includes('ssl') && file.match(/^(.+?)[-_]access\.log$/);
      // Non-SSL error log (must not contain 'ssl')
      const errorMatch = !file.includes('ssl') && file.match(/^(.+?)[-_]error\.log$/);

      if (sslAccessMatch) {
        const domain = sslAccessMatch[1];
        if (!domainLogs[domain]) domainLogs[domain] = {};
        domainLogs[domain].sslAccessLog = path.join(NGINX_LOG_DIR, file);
      } else if (sslErrorMatch) {
        const domain = sslErrorMatch[1];
        if (!domainLogs[domain]) domainLogs[domain] = {};
        domainLogs[domain].sslErrorLog = path.join(NGINX_LOG_DIR, file);
      } else if (accessMatch) {
        const domain = accessMatch[1];
        if (!domainLogs[domain]) domainLogs[domain] = {};
        domainLogs[domain].accessLog = path.join(NGINX_LOG_DIR, file);
      } else if (errorMatch) {
        const domain = errorMatch[1];
        if (!domainLogs[domain]) domainLogs[domain] = {};
        domainLogs[domain].errorLog = path.join(NGINX_LOG_DIR, file);
      }
    });

    return Object.entries(domainLogs).map(([domain, logs]) => ({
      domain,
      accessLog: logs.accessLog || '',
      errorLog: logs.errorLog || '',
      sslAccessLog: logs.sslAccessLog || '',
      sslErrorLog: logs.sslErrorLog || ''
    }));
  } catch (error) {
    logger.error('Error reading domain log files:', error);
    return [];
  }
}

/**
 * Get parsed logs from all sources
 */
export async function getParsedLogs(options: LogFilterOptions = {}): Promise<ParsedLogEntry[]> {
  const { limit = 100, level, type, search, domain } = options;

  const allLogs: ParsedLogEntry[] = [];

  try {
    // If specific domain is requested, read only that domain's logs
    if (domain && domain !== 'all') {
      // Define all possible log file paths (both HTTP and HTTPS)
      const logPaths = {
        httpAccess: [
          path.join(NGINX_LOG_DIR, `${domain}_access.log`),
          path.join(NGINX_LOG_DIR, `${domain}-access.log`)
        ],
        httpError: [
          path.join(NGINX_LOG_DIR, `${domain}_error.log`),
          path.join(NGINX_LOG_DIR, `${domain}-error.log`)
        ],
        httpsAccess: [
          path.join(NGINX_LOG_DIR, `${domain}_ssl_access.log`),
          path.join(NGINX_LOG_DIR, `${domain}-ssl-access.log`)
        ],
        httpsError: [
          path.join(NGINX_LOG_DIR, `${domain}_ssl_error.log`),
          path.join(NGINX_LOG_DIR, `${domain}-ssl-error.log`)
        ]
      };

      // Helper function to find existing log file
      const findExistingFile = async (paths: string[]): Promise<string | null> => {
        for (const filePath of paths) {
          try {
            await fs.access(filePath);
            return filePath;
          } catch {
            continue;
          }
        }
        return null;
      };

      // Read domain access logs (both HTTP and HTTPS)
      if (!type || type === 'all' || type === 'access') {
        // HTTP access logs
        const httpAccessLog = await findExistingFile(logPaths.httpAccess);
        if (httpAccessLog) {
          const accessLines = await readLastLines(httpAccessLog, Math.ceil(limit / 4));
          accessLines.forEach((line, index) => {
            const parsed = parseAccessLogLine(line, index, domain);
            if (parsed) allLogs.push(parsed);
          });
        }

        // HTTPS access logs
        const httpsAccessLog = await findExistingFile(logPaths.httpsAccess);
        if (httpsAccessLog) {
          const sslAccessLines = await readLastLines(httpsAccessLog, Math.ceil(limit / 4));
          sslAccessLines.forEach((line, index) => {
            const parsed = parseAccessLogLine(line, index, domain);
            if (parsed) allLogs.push(parsed);
          });
        }
      }

      // Read domain error logs (both HTTP and HTTPS)
      if (!type || type === 'all' || type === 'error') {
        // HTTP error logs
        const httpErrorLog = await findExistingFile(logPaths.httpError);
        if (httpErrorLog) {
          const errorLines = await readLastLines(httpErrorLog, Math.ceil(limit / 4));
          errorLines.forEach((line, index) => {
            const parsed = parseErrorLogLine(line, index);
            if (parsed) {
              parsed.domain = domain;
              allLogs.push(parsed);
            }
          });
        }

        // HTTPS error logs
        const httpsErrorLog = await findExistingFile(logPaths.httpsError);
        if (httpsErrorLog) {
          const sslErrorLines = await readLastLines(httpsErrorLog, Math.ceil(limit / 4));
          sslErrorLines.forEach((line, index) => {
            const parsed = parseErrorLogLine(line, index);
            if (parsed) {
              parsed.domain = domain;
              allLogs.push(parsed);
            }
          });
        }
      }
    } else {
      // Read global nginx logs
      if (!type || type === 'all' || type === 'access') {
        const accessLines = await readLastLines(NGINX_ACCESS_LOG, Math.ceil(limit / 3));
        accessLines.forEach((line, index) => {
          const parsed = parseAccessLogLine(line, index);
          if (parsed) allLogs.push(parsed);
        });
      }

      if (!type || type === 'all' || type === 'error') {
        const errorLines = await readLastLines(NGINX_ERROR_LOG, Math.ceil(limit / 3));
        errorLines.forEach((line, index) => {
          const parsed = parseErrorLogLine(line, index);
          if (parsed) allLogs.push(parsed);
        });
      }

      // Read ModSecurity logs
      if (!type || type === 'all' || type === 'error') {
        const modsecLines = await readLastLines(MODSEC_AUDIT_LOG, Math.ceil(limit / 3));
        modsecLines.forEach((line, index) => {
          const parsed = parseModSecLogLine(line, index);
          if (parsed) allLogs.push(parsed);
        });
      }

      // Also read all domain-specific logs if no specific domain requested
      if (!domain || domain === 'all') {
        const domainLogFiles = await getDomainLogFiles();
        const logsPerDomain = Math.ceil(limit / (domainLogFiles.length * 2 + 1)); // Divide among all domains and log types

        for (const { domain: domainName, accessLog, errorLog, sslAccessLog, sslErrorLog } of domainLogFiles) {
          // HTTP access logs
          if (accessLog && (!type || type === 'all' || type === 'access')) {
            const lines = await readLastLines(accessLog, logsPerDomain);
            lines.forEach((line, index) => {
              const parsed = parseAccessLogLine(line, index, domainName);
              if (parsed) allLogs.push(parsed);
            });
          }

          // HTTPS access logs
          if (sslAccessLog && (!type || type === 'all' || type === 'access')) {
            const lines = await readLastLines(sslAccessLog, logsPerDomain);
            lines.forEach((line, index) => {
              const parsed = parseAccessLogLine(line, index, domainName);
              if (parsed) allLogs.push(parsed);
            });
          }

          // HTTP error logs
          if (errorLog && (!type || type === 'all' || type === 'error')) {
            const lines = await readLastLines(errorLog, logsPerDomain);
            lines.forEach((line, index) => {
              const parsed = parseErrorLogLine(line, index);
              if (parsed) {
                parsed.domain = domainName;
                allLogs.push(parsed);
              }
            });
          }

          // HTTPS error logs
          if (sslErrorLog && (!type || type === 'all' || type === 'error')) {
            const lines = await readLastLines(sslErrorLog, logsPerDomain);
            lines.forEach((line, index) => {
              const parsed = parseErrorLogLine(line, index);
              if (parsed) {
                parsed.domain = domainName;
                allLogs.push(parsed);
              }
            });
          }
        }
      }
    }

    // Sort by timestamp descending (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filters
    let filtered = allLogs;

    if (level && level !== 'all') {
      filtered = filtered.filter(log => log.level === level);
    }

    if (type && type !== 'all') {
      filtered = filtered.filter(log => log.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        log.source.toLowerCase().includes(searchLower) ||
        (log.ip && log.ip.includes(searchLower)) ||
        (log.path && log.path.toLowerCase().includes(searchLower))
      );
    }

    // Apply limit
    return filtered.slice(0, limit);
  } catch (error) {
    logger.error('Error getting parsed logs:', error);
    return [];
  }
}

/**
 * Get log statistics
 */
export async function getLogStats(): Promise<LogStatistics> {
  const logs = await getParsedLogs({ limit: 1000 });

  const stats: LogStatistics = {
    total: logs.length,
    byLevel: { info: 0, warning: 0, error: 0 },
    byType: { access: 0, error: 0, system: 0 }
  };

  logs.forEach(log => {
    stats.byLevel[log.level]++;
    stats.byType[log.type]++;
  });

  return stats;
}

/**
 * Get available domains from database
 */
export async function getAvailableDomainsFromDb() {
  return await prisma.domain.findMany({
    select: {
      name: true,
      status: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}
