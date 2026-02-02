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
        lines: 50,
        functions: 53,
        branches: 49,
        statements: 50,
      },
    },
  },
});
