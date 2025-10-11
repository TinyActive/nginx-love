import { beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';
import path from 'path';

const execAsync = promisify(exec);

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

beforeAll(async () => {
  console.log('🔧 Setting up test environment...');

  // Skip database setup in CI or if DATABASE_URL is not set
  if (!process.env.DATABASE_URL || process.env.SKIP_DB_SETUP === 'true') {
    console.log('⚠️  Skipping database setup (DATABASE_URL not configured or SKIP_DB_SETUP=true)');
    return;
  }

  try {
    // Push schema to test database (creates tables without migrations)
    await execAsync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      cwd: __dirname,
    });
    console.log('✅ Test database ready');
  } catch (error: any) {
    console.error('❌ Failed to setup test database:', error.message);
    console.log('💡 Make sure PostgreSQL is running and test database exists.');
    console.log('   Create test database: createdb nginx_waf_test');
    // Don't throw - allow tests to run but they may fail
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  // Cleanup happens via database transactions in tests
  console.log('✅ Test cleanup complete');
});
