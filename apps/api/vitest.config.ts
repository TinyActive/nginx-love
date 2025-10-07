import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/__tests__/**',
        '**/types/**',
        '**/dto/**',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    // Run tests sequentially to avoid database conflicts
    threads: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@domains': path.resolve(__dirname, './src/domains'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },
});
