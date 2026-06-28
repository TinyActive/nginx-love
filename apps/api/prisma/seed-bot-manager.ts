import { PrismaClient } from '@prisma/client';
import { FINGERPRINT_LIBRARY } from '../src/domains/bot-manager/data/fingerprint-library';

const prisma = new PrismaClient();

async function main() {
  for (const rule of FINGERPRINT_LIBRARY) {
    const existing = await prisma.botRule.findFirst({
      where: {
        isBuiltin: true,
        fingerprintType: rule.fingerprintType,
        fingerprint: rule.fingerprint,
        profileId: null,
      },
    });

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
          enabled: rule.action === 'deny' && (rule.demoBlock ?? false),
          profileId: null,
          priority: rule.demoBlock ? 50 : 200,
        },
      });
      console.log(`Created builtin rule: ${rule.name}`);
      continue;
    }

    await prisma.botRule.update({
      where: { id: existing.id },
      data: {
        name: rule.name,
        clientLabel: rule.clientLabel,
        notes: rule.notes,
        action: rule.action,
      },
    });
  }

  console.log(`Fingerprint library: ${FINGERPRINT_LIBRARY.length} entries synced`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
