/**
 * Seeds fingerprint library and applies global Bot Manager block rules for WAF demo.
 * Run: node dist/scripts/seed-waf-fingerprint-demo.js
 */
import { PrismaClient } from '@prisma/client';
import { FINGERPRINT_LIBRARY, DEMO_BLOCK_RULES } from '../domains/bot-manager/data/fingerprint-library';
import { botNginxService } from '../domains/bot-manager/services/bot-nginx.service';

const prisma = new PrismaClient();

async function syncLibrary() {
  for (const rule of FINGERPRINT_LIBRARY) {
    const existing = await prisma.botRule.findFirst({
      where: {
        isBuiltin: true,
        fingerprintType: rule.fingerprintType,
        fingerprint: rule.fingerprint,
        profileId: null,
      },
    });

    const enabled = rule.demoBlock === true && rule.action === 'deny';

    if (!existing) {
      await prisma.botRule.create({
        data: {
          name: rule.name,
          fingerprintType: rule.fingerprintType,
          fingerprint: rule.fingerprint,
          action: rule.action,
          clientLabel: rule.clientLabel,
          notes: rule.notes,
          isBuiltin: true,
          enabled,
          profileId: null,
          priority: rule.demoBlock ? 50 : 200,
        },
      });
      console.log(`+ ${rule.name}`);
    } else {
      await prisma.botRule.update({
        where: { id: existing.id },
        data: {
          name: rule.name,
          clientLabel: rule.clientLabel,
          notes: rule.notes,
          action: rule.action,
          enabled: rule.demoBlock ? enabled : existing.enabled,
        },
      });
    }
  }
}

async function enableDemoBlocks() {
  for (const rule of DEMO_BLOCK_RULES) {
    const row = await prisma.botRule.findFirst({
      where: {
        isBuiltin: true,
        fingerprintType: rule.fingerprintType,
        fingerprint: rule.fingerprint,
        profileId: null,
      },
    });
    if (row) {
      await prisma.botRule.update({
        where: { id: row.id },
        data: { enabled: true, action: 'deny' },
      });
      console.log(`Block enabled: ${rule.clientLabel} (${rule.fingerprintType})`);
    }
  }
}

async function ensureDomainBotManager() {
  const domain = await prisma.domain.findFirst({ where: { name: 'waf.autogate.cc' } });
  if (!domain) {
    console.warn('Domain waf.autogate.cc not found — skip domain config');
    return;
  }
  if (!domain.botManagerEnabled) {
    await prisma.domain.update({
      where: { id: domain.id },
      data: { botManagerEnabled: true },
    });
    console.log('Enabled Bot Manager on waf.autogate.cc');
  }
}

export async function runWafFingerprintDemoSeed(): Promise<void> {
  console.log('=== WAF Fingerprint Demo Setup ===');
  await syncLibrary();
  await enableDemoBlocks();
  await ensureDomainBotManager();

  const result = await botNginxService.applyAll();
  if (!result.success) {
    throw new Error(result.message);
  }
  console.log(result.message);

  const { domainsService } = await import('../domains/domains/domains.service');
  const domain = await prisma.domain.findFirst({ where: { name: 'waf.autogate.cc' } });
  if (domain) {
    await domainsService.regenerateConfig(domain.id);
    console.log('Regenerated nginx config for waf.autogate.cc');
  }

  console.log('=== Demo ready — run tests/waf-bot-block/run-tests.sh ===');
}

if (require.main === module) {
  runWafFingerprintDemoSeed()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
