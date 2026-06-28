import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import logger from '../../../utils/logger';
import prisma from '../../../config/database';
import { BotAnalyticsResult, FingerprintStats, Ja4FingerprintType } from '../bot-manager.types';

const JA4_GLOBAL_LOG_PATH = '/var/log/nginx/ja4-fingerprints.log';

const JA4_FIELD_MAP: Record<string, Ja4FingerprintType> = {
  JA4: 'ja4',
  JA4H: 'ja4h',
  JA4S: 'ja4s',
  JA4TCP: 'ja4tcp',
  JA4one: 'ja4one',
};

export class BotAnalyticsService {
  async getAnalytics(options: {
    domain?: string;
    limit?: number;
    logPath?: string;
  } = {}): Promise<BotAnalyticsResult> {
    const limit = options.limit ?? 20;
    const logPaths = options.logPath
      ? [options.logPath]
      : await this.resolveLogPaths(options.domain);

    const counts = new Map<string, FingerprintStats>();
    const byType: Record<string, number> = {};
    let totalRequests = 0;

    for (const logPath of logPaths) {
      try {
        await fs.access(logPath);
      } catch {
        continue;
      }

      const stream = createReadStream(logPath, { encoding: 'utf8' });
      const rl = createInterface({ input: stream, crlfDelay: Infinity });

      for await (const line of rl) {
        if (!this.isJa4LogLine(line)) continue;

        totalRequests++;

        for (const [field, type] of Object.entries(JA4_FIELD_MAP)) {
          const match = line.match(new RegExp(`${field}="([^"]*)"`, 'i'));
          if (!match || !match[1] || match[1] === '-' || match[1] === '') continue;

          const fingerprint = match[1];
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

  private isJa4LogLine(line: string): boolean {
    return /JA4(H|S|TCP)?="/i.test(line);
  }

  private async resolveLogPaths(domain?: string): Promise<string[]> {
    if (domain) {
      return [
        `/var/log/nginx/${domain}_ssl_access.log`,
        `/var/log/nginx/${domain}_access.log`,
      ];
    }

    try {
      const domains = await prisma.domain.findMany({
        where: { botManagerEnabled: true },
        select: { name: true },
      });

      if (domains.length > 0) {
        return domains.flatMap((d) => [
          `/var/log/nginx/${d.name}_ssl_access.log`,
          `/var/log/nginx/${d.name}_access.log`,
        ]);
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.warn(`Could not resolve Bot Manager domain logs: ${err.message}`);
    }

    return [JA4_GLOBAL_LOG_PATH];
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
    const domainLog = `/var/log/nginx/${domain}_ssl_access.log`;
    try {
      const content = await fs.readFile(domainLog, 'utf8');
      return content.split('\n').filter(Boolean).slice(-limit);
    } catch {
      logger.warn(`Could not read domain log: ${domainLog}`);
      return [];
    }
  }
}

export const botAnalyticsService = new BotAnalyticsService();
