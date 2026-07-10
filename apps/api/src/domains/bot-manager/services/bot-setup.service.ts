import * as fs from 'fs/promises';
import logger from '../../../utils/logger';
import prisma from '../../../config/database';
import { FINGERPRINT_LIBRARY } from '../data/fingerprint-library';

const BOT_PROFILES_DIR = '/etc/nginx/bot-profiles';
const BOT_GLOBAL_CONF = '/etc/nginx/conf.d/bot-manager-global.conf';

/**
 * Bot Manager setup service
 * Initializes directories and placeholder nginx config for JA4 fingerprint rules
 */
export class BotSetupService {
  async initializeBotManagerConfig(): Promise<void> {
    try {
      logger.info('Initializing Bot Manager (JA4) configuration...');

      await fs.mkdir(BOT_PROFILES_DIR, { recursive: true });
      await fs.chmod(BOT_PROFILES_DIR, 0o750);
      logger.info(`Bot profiles directory ready: ${BOT_PROFILES_DIR}`);

      await fs.mkdir('/etc/nginx/conf.d', { recursive: true });

      try {
        await fs.access(BOT_GLOBAL_CONF);
        logger.info('Bot Manager global config already exists');
      } catch {
        const placeholder = `# Bot Manager Global Rules - Nginx Love UI
# Auto-generated - do not edit manually
# Generated at: ${new Date().toISOString()}

# No global bot rules configured yet
`;
        await fs.writeFile(BOT_GLOBAL_CONF, placeholder, 'utf-8');
        logger.info('Bot Manager global config initialized');
      }

      logger.info('Bot Manager initialization completed');

      // Seed builtin fingerprint rules if missing
      await this.seedBuiltinRules();
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'EACCES') {
        logger.warn('Permission denied initializing Bot Manager directories');
      } else {
        logger.warn(`Bot Manager initialization failed: ${err.message}`);
      }
    }
  }

  private async seedBuiltinRules(): Promise<void> {
    try {
      const existing = await prisma.botRule.count({ where: { isBuiltin: true } });
      if (existing > 0) return;

      const builtins = FINGERPRINT_LIBRARY.filter((r) => r.demoBlock || r.action === 'deny').slice(0, 5);

      for (const rule of builtins) {
        await prisma.botRule.create({
          data: {
            name: rule.name,
            fingerprintType: rule.fingerprintType,
            fingerprint: rule.fingerprint,
            action: rule.action,
            clientLabel: rule.clientLabel,
            notes: rule.notes,
            profileId: null,
            enabled: rule.demoBlock === true,
            priority: 100,
            isBuiltin: true,
          },
        });
      }
      logger.info('Builtin Bot Manager fingerprint rules seeded');
    } catch {
      // DB may not be migrated yet on first boot
    }
  }
}

export const botSetupService = new BotSetupService();
