import * as fs from 'fs/promises';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import logger from '../../utils/logger';
import prisma from '../../config/database';
import { ParsedLogEntry, LogFilterOptions, LogStatistics } from './logs.types';
import { parseAccessLogLine, parseErrorLogLine, parseModSecLogLine } from './services/log-parser.service';

const execFileAsync = promisify(execFile);

// Log file paths
const LOG_PATHS = {
  nginxAccess: '/var/log/nginx/access.log',
  nginxError: '/var/log/nginx/error.log',
  modsecAudit: '/var/log/modsec_audit.log',
  nginxDir: '/var/log/nginx',
} as const;

// Security constants
const SECURITY_LIMITS = {
  maxLinesPerFile: 1000,
  maxConcurrentFiles: 5,
  maxUniqueIdLength: 64,
  maxSearchTermLength: 200,
  maxRuleIdLength: 100,
  execTimeout: 5000,
  grepTimeout: 10000,
  maxBuffer: 10 * 1024 * 1024, // 10MB
} as const;

const ALLOWED_LOG_DIR = path.resolve(LOG_PATHS.nginxDir);

// Domain regex for validation
const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Log file naming patterns
const LOG_PATTERNS = {
  sslAccess: /^([a-zA-Z0-9.-]+)[-_]ssl[-_]access\.log$/,
  sslError: /^([a-zA-Z0-9.-]+)[-_]ssl[-_]error\.log$/,
  access: /^([a-zA-Z0-9.-]+)[-_]access\.log$/,
  error: /^([a-zA-Z0-9.-]+)[-_]error\.log$/,
} as const;

/**
 * Validate and sanitize domain name
 */
function sanitizeDomain(domain: string): string | null {
  if (!domain || typeof domain !== 'string') return null;
  
  const cleaned = domain.trim().replace(/[^a-zA-Z0-9.-]/g, '');
  return DOMAIN_REGEX.test(cleaned) && cleaned.length <= 253 ? cleaned : null;
}

/**
 * Validate file path is within allowed directory
 */
function isPathSafe(filePath: string): boolean {
  return path.resolve(filePath).startsWith(ALLOWED_LOG_DIR);
}

/**
 * Execute command with security measures
 */
async function safeExecFile(
  command: string,
  args: string[],
  options: { input?: string; timeout?: number } = {}
): Promise<string> {
  const { input, timeout = SECURITY_LIMITS.execTimeout } = options;
  
  try {
    const { stdout } = await execFileAsync(command, args, {
      timeout,
      maxBuffer: SECURITY_LIMITS.maxBuffer,
      encoding: 'utf8',
      ...(input && { input }),
    });
    return stdout.trim();
  } catch (error: any) {
    // grep exit code 1 means no matches - this is normal
    if (error.code === 1) return '';
    if (error.killed) {
      logger.warn(`Command timed out: ${command} ${args.join(' ')}`);
    }
    throw error;
  }
}

/**
 * Read last N lines from a file with security checks
 */
async function readLastLines(filePath: string, numLines: number): Promise<string[]> {
  try {
    if (!isPathSafe(filePath)) {
      logger.warn(`Path validation failed: ${filePath}`);
      return [];
    }

    const safeNumLines = Math.min(Math.max(numLines, 1), SECURITY_LIMITS.maxLinesPerFile);
    await fs.access(filePath);

    const stdout = await safeExecFile('tail', ['-n', String(safeNumLines), filePath]);
    return stdout.split('\n').filter(line => line.trim().length > 0);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logger.debug(`Log file not found: ${filePath}`);
    } else {
      logger.error(`Error reading log file: ${error.message}`);
    }
    return [];
  }
}

/**
 * Parse log lines with appropriate parser
 */
interface ParseOptions {
  parser: 'access' | 'error' | 'modsec';
  domain?: string;
}

function parseLogLines(
  lines: string[],
  { parser, domain }: ParseOptions
): ParsedLogEntry[] {
  const parsers = {
    access: (line: string, idx: number) => parseAccessLogLine(line, idx, domain),
    error: (line: string, idx: number) => {
      const parsed = parseErrorLogLine(line, idx);
      if (parsed && domain) parsed.domain = domain;
      return parsed;
    },
    modsec: (line: string, idx: number) => {
      const parsed = parseModSecLogLine(line, idx);
      if (parsed && domain) parsed.domain = domain;
      return parsed;
    },
  };

  return lines
    .map((line, idx) => parsers[parser](line, idx))
    .filter((entry): entry is ParsedLogEntry => entry !== null);
}

/**
 * Search logs using grep
 */
async function grepLogFile(
  filePath: string,
  pattern: string,
  limit: number
): Promise<string> {
  if (!isPathSafe(filePath)) return '';

  try {
    const grepResult = await safeExecFile(
      'grep',
      ['-F', pattern, filePath],
      { timeout: SECURITY_LIMITS.grepTimeout }
    );

    if (!grepResult) return '';

    return await safeExecFile(
      'head',
      ['-n', String(limit)],
      { input: grepResult, timeout: SECURITY_LIMITS.execTimeout }
    );
  } catch (error: any) {
    if (error.code !== 1 && !error.killed) {
      logger.debug(`Grep failed for ${filePath}: ${error.message}`);
    }
    return '';
  }
}

/**
 * Get domain log file paths
 */
interface DomainLogFiles {
  domain: string;
  accessLog: string;
  errorLog: string;
  sslAccessLog: string;
  sslErrorLog: string;
}

async function getDomainLogFiles(): Promise<DomainLogFiles[]> {
  try {
    if (!isPathSafe(LOG_PATHS.nginxDir)) {
      logger.error('Log directory validation failed');
      return [];
    }

    const files = await fs.readdir(LOG_PATHS.nginxDir);
    logger.info(`Found ${files.length} files in ${LOG_PATHS.nginxDir}`);
    const domainLogs: Record<string, Partial<Omit<DomainLogFiles, 'domain'>>> = {};

    files.forEach(file => {
      // Skip hidden files and parent directory references
      if (file.startsWith('.') || file.includes('..')) return;

      const fullPath = path.join(LOG_PATHS.nginxDir, file);
      if (!isPathSafe(fullPath)) return;

      // Match against patterns
      const patterns = [
        { regex: LOG_PATTERNS.sslAccess, key: 'sslAccessLog', requireNoSSL: false },
        { regex: LOG_PATTERNS.sslError, key: 'sslErrorLog', requireNoSSL: false },
        { regex: LOG_PATTERNS.access, key: 'accessLog', requireNoSSL: true },
        { regex: LOG_PATTERNS.error, key: 'errorLog', requireNoSSL: true },
      ] as const;

      for (const { regex, key, requireNoSSL } of patterns) {
        if (requireNoSSL && file.includes('ssl')) continue;
        
        const match = file.match(regex);
        if (match) {
          const domain = sanitizeDomain(match[1]);
          if (domain) {
            if (!domainLogs[domain]) domainLogs[domain] = {};
            domainLogs[domain][key] = fullPath;
          }
          break;
        }
      }
    });

    const result = Object.entries(domainLogs).map(([domain, logs]) => ({
      domain,
      accessLog: logs.accessLog || '',
      errorLog: logs.errorLog || '',
      sslAccessLog: logs.sslAccessLog || '',
      sslErrorLog: logs.sslErrorLog || '',
    }));
    
    logger.info(`Found ${result.length} domains with logs: ${result.map(d => d.domain).join(', ')}`);
    
    return result;
  } catch (error) {
    logger.error('Error reading domain log files:', error);
    return [];
  }
}

/**
 * Find existing log file from possible paths
 */
async function findExistingFile(paths: string[]): Promise<string | null> {
  for (const filePath of paths) {
    if (!isPathSafe(filePath)) continue;
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Get domain-specific log file paths
 */
function getDomainLogPaths(domain: string) {
  return {
    httpAccess: [
      path.join(LOG_PATHS.nginxDir, `${domain}_access.log`),
      path.join(LOG_PATHS.nginxDir, `${domain}-access.log`)
    ],
    httpError: [
      path.join(LOG_PATHS.nginxDir, `${domain}_error.log`),
      path.join(LOG_PATHS.nginxDir, `${domain}-error.log`)
    ],
    httpsAccess: [
      path.join(LOG_PATHS.nginxDir, `${domain}_ssl_access.log`),
      path.join(LOG_PATHS.nginxDir, `${domain}-ssl-access.log`)
    ],
    httpsError: [
      path.join(LOG_PATHS.nginxDir, `${domain}_ssl_error.log`),
      path.join(LOG_PATHS.nginxDir, `${domain}-ssl-error.log`)
    ]
  };
}

/**
 * Read and parse log file
 */
async function readAndParseLog(
  filePath: string | null,
  limit: number,
  parser: ParseOptions
): Promise<ParsedLogEntry[]> {
  if (!filePath) return [];
  const lines = await readLastLines(filePath, limit);
  return parseLogLines(lines, parser);
}

/**
 * Read domain-specific logs
 */
async function readDomainLogs(
  domain: string,
  limit: number,
  type?: string
): Promise<ParsedLogEntry[]> {
  const logPaths = getDomainLogPaths(domain);
  const results: ParsedLogEntry[] = [];

  const shouldReadAccess = !type || type === 'all' || type === 'access';
  const shouldReadError = !type || type === 'all' || type === 'error';

  // Read access logs
  if (shouldReadAccess) {
    const [httpAccess, httpsAccess] = await Promise.all([
      findExistingFile(logPaths.httpAccess),
      findExistingFile(logPaths.httpsAccess)
    ]);

    const [httpLogs, httpsLogs] = await Promise.all([
      readAndParseLog(httpAccess, limit, { parser: 'access', domain }),
      readAndParseLog(httpsAccess, limit, { parser: 'access', domain })
    ]);

    results.push(...httpLogs, ...httpsLogs);
  }

  // Read error logs
  if (shouldReadError) {
    const [httpError, httpsError] = await Promise.all([
      findExistingFile(logPaths.httpError),
      findExistingFile(logPaths.httpsError)
    ]);

    const [httpLogs, httpsLogs] = await Promise.all([
      readAndParseLog(httpError, limit, { parser: 'error', domain }),
      readAndParseLog(httpsError, limit, { parser: 'error', domain })
    ]);

    results.push(...httpLogs, ...httpsLogs);
  }

  return results;
}

/**
 * Read global logs
 */
async function readGlobalLogs(
  limit: number,
  type?: string
): Promise<ParsedLogEntry[]> {
  const results: ParsedLogEntry[] = [];
  const logsPerType = Math.ceil(limit / 3);

  const shouldReadAccess = !type || type === 'all' || type === 'access';
  const shouldReadError = !type || type === 'all' || type === 'error';

  if (shouldReadAccess && isPathSafe(LOG_PATHS.nginxAccess)) {
    const logs = await readAndParseLog(LOG_PATHS.nginxAccess, logsPerType, { parser: 'access' });
    results.push(...logs);
  }

  if (shouldReadError) {
    const [errorLogs, modsecLogs] = await Promise.all([
      isPathSafe(LOG_PATHS.nginxError)
        ? readAndParseLog(LOG_PATHS.nginxError, logsPerType, { parser: 'error' })
        : Promise.resolve([]),
      isPathSafe(LOG_PATHS.modsecAudit)
        ? readAndParseLog(LOG_PATHS.modsecAudit, logsPerType, { parser: 'modsec' })
        : Promise.resolve([])
    ]);

    results.push(...errorLogs, ...modsecLogs);
  }

  return results;
}

/**
 * Read all domain logs with concurrency control
 */
async function readAllDomainLogs(
  limit: number,
  type?: string
): Promise<ParsedLogEntry[]> {
  const results: ParsedLogEntry[] = [];
  const domainLogFiles = await getDomainLogFiles();
  const logsPerDomain = Math.max(1, Math.ceil(limit / (domainLogFiles.length * 2 + 1)));

  for (let i = 0; i < domainLogFiles.length; i += SECURITY_LIMITS.maxConcurrentFiles) {
    const batch = domainLogFiles.slice(i, i + SECURITY_LIMITS.maxConcurrentFiles);
    
    const batchResults = await Promise.all(
      batch.map(async ({ domain, accessLog, errorLog, sslAccessLog, sslErrorLog }) => {
        const domainResults: ParsedLogEntry[] = [];
        const shouldReadAccess = !type || type === 'all' || type === 'access';
        const shouldReadError = !type || type === 'all' || type === 'error';

        const readPromises: Promise<ParsedLogEntry[]>[] = [];

        if (shouldReadAccess) {
          if (accessLog) {
            readPromises.push(readAndParseLog(accessLog, logsPerDomain, { parser: 'access', domain }));
          }
          if (sslAccessLog) {
            readPromises.push(readAndParseLog(sslAccessLog, logsPerDomain, { parser: 'access', domain }));
          }
        }

        if (shouldReadError) {
          if (errorLog) {
            readPromises.push(readAndParseLog(errorLog, logsPerDomain, { parser: 'error', domain }));
          }
          if (sslErrorLog) {
            readPromises.push(readAndParseLog(sslErrorLog, logsPerDomain, { parser: 'error', domain }));
          }
        }

        const results = await Promise.all(readPromises);
        return results.flat();
      })
    );

    results.push(...batchResults.flat());
  }

  return results;
}

/**
 * Apply filters to log entries
 */
function applyFilters(
  logs: ParsedLogEntry[],
  filters: LogFilterOptions
): ParsedLogEntry[] {
  let filtered = logs;

  if (filters.level && filters.level !== 'all') {
    filtered = filtered.filter(log => log.level === filters.level);
  }

  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(log => log.type === filters.type);
  }

  if (filters.search) {
    const searchTerm = filters.search
      .toLowerCase()
      .substring(0, SECURITY_LIMITS.maxSearchTermLength);
    
    filtered = filtered.filter(log =>
      log.message.toLowerCase().includes(searchTerm) ||
      log.source.toLowerCase().includes(searchTerm) ||
      (log.ip && log.ip.includes(searchTerm)) ||
      (log.path && log.path.toLowerCase().includes(searchTerm))
    );
  }

  if (filters.ruleId) {
    const safeRuleId = filters.ruleId.substring(0, SECURITY_LIMITS.maxRuleIdLength);
    filtered = filtered.filter(log => log.ruleId?.includes(safeRuleId));
  }

  if (filters.uniqueId) {
    const safeUniqueId = filters.uniqueId.substring(0, SECURITY_LIMITS.maxUniqueIdLength);
    filtered = filtered.filter(log => log.uniqueId?.includes(safeUniqueId));
  }

  return filtered;
}

/**
 * Get parsed logs from all sources
 */
export async function getParsedLogs(options: LogFilterOptions = {}): Promise<ParsedLogEntry[]> {
  const {
    limit = 100,
    offset = 0,
    domain,
    uniqueId,
    type
  } = options;

  const safeLimit = Math.min(Math.max(limit, 1), SECURITY_LIMITS.maxLinesPerFile);
  const safeOffset = Math.max(offset || 0, 0);

  try {
    // Validate domain
    const safeDomain = domain ? sanitizeDomain(domain) : null;
    if (domain && domain !== 'all' && !safeDomain) {
      logger.warn(`Invalid domain: ${domain}`);
      return [];
    }

    let allLogs: ParsedLogEntry[];

    // Read logs based on domain filter
    if (safeDomain && safeDomain !== 'all') {
      allLogs = await readDomainLogs(safeDomain, safeLimit, type);
    } else {
      const [globalLogs, domainLogs] = await Promise.all([
        readGlobalLogs(safeLimit, type),
        domain === 'all' ? readAllDomainLogs(safeLimit, type) : Promise.resolve([])
      ]);
      allLogs = [...globalLogs, ...domainLogs];
    }

    // Sort by timestamp descending
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filters
    const filtered = applyFilters(allLogs, options);

    // Apply pagination
    return filtered.slice(safeOffset, safeOffset + safeLimit);
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
  try {
    return await prisma.domain.findMany({
      select: { name: true, status: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    logger.error('Error fetching domains from database:', error);
    return [];
  }
}