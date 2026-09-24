/// <reference path="../.astro/types.d.ts" />

// Worker bindings and secrets (read via `import { env } from 'cloudflare:workers'`)
// are typed in the generated worker-configuration.d.ts — run `npm run cf-typegen`
// after changing wrangler.jsonc or .dev.vars.example.

// Build-time variables, inlined by Vite. PUBLIC_ ones also reach the client.
interface ImportMetaEnv {
  readonly PUBLIC_SENTRY_DSN?: string;
  readonly PUBLIC_SENTRY_ENVIRONMENT?: string;
  readonly PUBLIC_SENTRY_RELEASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Form attributes (legacy - kept for compatibility)
declare global {
  namespace astroHTML.JSX {
    interface IntrinsicElements {
      form: astroHTML.JSX.HTMLAttributes<HTMLFormElement> & {
        'data-netlify'?: string;
      };
    }
  }
}