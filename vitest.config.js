import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/e2e/**'],
    reporters: process.env.GITHUB_ACTIONS 
      ? ['default', 'github-actions', 'junit'] 
      : ['default'],
    outputFile: {
      junit: './test-results/vitest-results.xml',
    },
  },
});