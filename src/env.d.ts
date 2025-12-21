/// <reference path="../.astro/types.d.ts" />
/// <reference types="@astrojs/cloudflare" />

interface ImportMetaEnv {
  readonly ANTHROPIC_API_KEY: string;
  readonly ANTHROPIC_MODEL?: string;
  // Sentry configuration (PUBLIC_ prefix makes them available client-side)
  readonly PUBLIC_SENTRY_DSN?: string;
  readonly PUBLIC_SENTRY_ENVIRONMENT?: string;
  readonly PUBLIC_SENTRY_RELEASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type Runtime = import('@astrojs/cloudflare').Runtime<{
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL?: string;
  ANALYTICS_KV?: KVNamespace;
  STATS_TOKEN?: string;
  // Sentry configuration
  PUBLIC_SENTRY_DSN?: string;
  PUBLIC_SENTRY_ENVIRONMENT?: string;
  PUBLIC_SENTRY_RELEASE?: string;
}>;

declare namespace App {
  interface Locals extends Runtime {}
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