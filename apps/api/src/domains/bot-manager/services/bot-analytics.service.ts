import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  extractJa4FieldsFromLogLine,
  isJa4AccessLogLine,
} from '@nginx-love/shared';
import logger from '../../../utils/logger';
import prisma from '../../../config/database';
import { BotAnalyticsResult, FingerprintStats, Ja4FingerprintType } from '../bot-manager.types';

const execFileAsync = promisify(execFile);

const JA4_GLOBAL_LOG_PATH = '/var/log/nginx/ja4-fingerprints.log';
const SAFE_DOMAIN_RE = /^[a-zA-Z0-9._-]+$/;
const ALLOWED_LOG_PREFIX = '/var/log/nginx/';

function isSafeDomainName(domain: string): boolean {
  return SAFE_DOMAIN_RE.test(domain);
}

function domainLogPaths(domain: string): string[] {
  return [
    `/var/log/nginx/${domain}_ssl_access.log`,
    `/var/log/nginx/${domain}_access.log`,
  ];
}

function isAllowedLogPath(logPath: string): boolean {
  return logPath.startsWith(ALLOWED_LOG_PREFIX) && !logPath.includes('..');
}

export class BotAnalyticsService {
  async getAnalytics(options: {
    domain?: string;
    limit?: number;
    logPath?: string;
  } = {}): Promise<BotAnalyticsResult> {
    const limit = options.limit ?? 20;
    const logPaths = await this.resolveLogPaths(options);

    const counts = new Map<string, FingerprintStats>();
    const byType: Record<string, number> = {};
    let totalRequests = 0;

    for (const logPath of logPaths) {
      try {
        await fs.access(logPath);
      } catch {
        continue;
      }

      const lineStats = await this.collectLineStats(logPath);
      totalRequests += lineStats.totalRequests;
      for (const [type, count] of Object.entries(lineStats.byType)) {
        byType[type] = (byType[type] || 0) + count;
      }
      for (const [key, stat] of lineStats.counts) {
        const existing = counts.get(key);
        if (existing) {
          existing.count += stat.count;
        } else {
          counts.set(key, { ...stat });
        }
      }
    }

    const topFingerprints = Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return {
      totalRequests,
      uniqueFingerprints: counts.size,
      topFingerprints,
      byType,
    };
  }

  private async resolveLogPaths(options: {
    domain?: string;
    logPath?: string;
  }): Promise<string[]> {
    if (options.logPath) {
      return isAllowedLogPath(options.logPath) ? [options.logPath] : [];
    }

    if (options.domain) {
      if (!isSafeDomainName(options.domain)) {
        logger.warn('Invalid domain name for analytics');
        return [];
      }
      return domainLogPaths(options.domain);
    }

    try {
      const domains = await prisma.domain.findMany({
        select: { name: true, sslEnabled: true },
      });

      const domainPaths = domains
        .filter((d) => isSafeDomainName(d.name))
        .flatMap((d) =>
          d.sslEnabled
            ? [`/var/log/nginx/${d.name}_ssl_access.log`, `/var/log/nginx/${d.name}_access.log`]
            : [`/var/log/nginx/${d.name}_access.log`]
        );

      if (domainPaths.length > 0) {
        return [...new Set([...domainPaths, JA4_GLOBAL_LOG_PATH])];
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.warn(`Could not resolve Bot Manager domain logs: ${err.message}`);
    }

    return [JA4_GLOBAL_LOG_PATH];
  }

  private async collectLineStats(logPath: string): Promise<{
    totalRequests: number;
    counts: Map<string, FingerprintStats>;
    byType: Record<string, number>;
  }> {
    const counts = new Map<string, FingerprintStats>();
    const byType: Record<string, number> = {};
    let totalRequests = 0;

    const stream = createReadStream(logPath, { encoding: 'utf8' });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!this.isJa4LogLine(line)) continue;

      totalRequests++;
      this.extractFingerprintsFromLine(line, counts, byType);
    }

    return { totalRequests, counts, byType };
  }

  private extractFingerprintsFromLine(
    line: string,
    counts: Map<string, FingerprintStats>,
    byType: Record<string, number>
  ): void {
    const fields = extractJa4FieldsFromLogLine(line);

    for (const [type, fingerprint] of Object.entries(fields) as [Ja4FingerprintType, string][]) {
      const key = `${type}:${fingerprint}`;
      byType[type] = (byType[type] || 0) + 1;

      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { fingerprintType: type, fingerprint, count: 1 });
      }
    }
  }

  private isJa4LogLine(line: string): boolean {
    return isJa4AccessLogLine(line);
  }

  async discoverFingerprints(options: {
    limit?: number;
    minCount?: number;
  } = {}): Promise<FingerprintStats[]> {
    const analytics = await this.getAnalytics({ limit: 1000 });
    const minCount = options.minCount ?? 1;
    const limit = options.limit ?? 50;

    return analytics.topFingerprints
      .filter((f) => f.count >= minCount)
      .slice(0, limit);
  }

  async readDomainLog(domain: string, limit = 100): Promise<string[]> {
    if (!isSafeDomainName(domain)) {
      logger.warn('Invalid domain name for log read');
      return [];
    }

    const domainLog = `/var/log/nginx/${domain}_ssl_access.log`;
    try {
      const { stdout } = await execFileAsync('tail', [
        '-n',
        String(Math.min(limit, 1000)),
        domainLog,
      ]);
      return stdout.split('\n').filter(Boolean);
    } catch {
      logger.warn('Could not read domain log');
      return [];
    }
  }
}

export const botAnalyticsService = new BotAnalyticsService();
