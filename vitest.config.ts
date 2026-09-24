import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Only resolvable inside workerd; see the stub for how tests use it.
      'cloudflare:workers': fileURLToPath(new URL('./src/test/cloudflare-workers-stub.ts', import.meta.url)),
    },
  },
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
        lines: 65,
        functions: 73,
        branches: 63,
        statements: 64,
      },
    },
  },
});
