import prisma from '../config/database';
import { domainsService } from '../domains/domains/domains.service';
import { botSetupService } from '../domains/bot-manager/services/bot-setup.service';

/**
 * Regenerate nginx vhost configs for all domains from the database.
 * Used by VM update.sh after JA4/nginx core upgrades so legacy vhosts get
 * `ja4 on;` and `main_ja4` access_log on HTTPS blocks.
 */
export async function runRegenerateDomainConfigs(): Promise<void> {
  await botSetupService.initializeBotManagerConfig();

  const { domains } = await domainsService.getDomains({ page: 1, limit: 1000 });

  if (!domains.length) {
    console.log('No domains to regenerate');
    return;
  }

  for (const domain of domains) {
    console.log(`Regenerating nginx config for: ${domain.name}`);
    await domainsService.regenerateConfig(domain.id);
  }

  console.log(`Regenerated ${domains.length} domain vhost(s)`);
}

if (require.main === module) {
  runRegenerateDomainConfigs()
    .then(() => prisma.$disconnect())
    .catch((error) => {
      console.error('Failed to regenerate domain nginx configs:', error);
      process.exit(1);
    });
}
