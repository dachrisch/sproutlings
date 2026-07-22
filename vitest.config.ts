import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
    reporters: ['default', 'junit'],
    outputFile: { junit: 'test-results/junit.xml' },
  },
});
