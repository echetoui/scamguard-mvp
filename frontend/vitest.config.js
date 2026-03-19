import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist'],

    // ===== Critical Worker Configuration =====
    // Single thread to prevent timeout issues with async tests
    threads: {
      maxThreads: 1,
      minThreads: 1,
      singleThread: true,
    },

    // Increase timeouts significantly
    testTimeout: 120000,
    hookTimeout: 120000,
    isolate: true,

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
