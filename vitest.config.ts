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
      // Coverage thresholds - floor to prevent regression, raise gradually
      thresholds: {
        lines: 39,
        functions: 41,
        branches: 35,
        statements: 39,
      },
    },
  },
});
