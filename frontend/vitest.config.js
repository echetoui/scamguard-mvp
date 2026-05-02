import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist'],

    // ===== Critical Worker Configuration =====
    // Use single worker to prevent timeout issues
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1,
      },
    },
    isolate: true,

    // Reasonable timeouts for heavy test suites
    testTimeout: 30000,
    hookTimeout: 30000,

    // ===== Other Optimizations =====
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/**/*.test.{js,jsx,ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
