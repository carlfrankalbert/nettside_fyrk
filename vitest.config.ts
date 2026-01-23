import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/utils/**', 'src/services/**', 'src/lib/**'],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
      // Coverage thresholds - fail CI if coverage drops below these levels
      // Set as floor based on current coverage to prevent regression
      thresholds: {
        lines: 35,
        functions: 35,
        branches: 35,
        statements: 35,
      },
    },
  },
});
