/**
 * Dev/CLI entry — delegates to compiled seed in Docker entrypoint.
 */
import { runSeedSafe } from '../src/scripts/seed-safe';

runSeedSafe().catch((e) => {
  console.error('❌ Error seeding database:', e);
  process.exit(1);
});
