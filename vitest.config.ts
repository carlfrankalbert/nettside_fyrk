import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/utils/**', 'src/services/**', 'src/lib/**', 'src/hooks/**'],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
      // Floor to prevent regression, set to what is actually achieved and
      // raised as tracks of docs/modernization-plan.md land. Not an aspiration.
      thresholds: {
        lines: 60,
        functions: 65,
        branches: 57,
        statements: 59,
      },
    },
  },
});
