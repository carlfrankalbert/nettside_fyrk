/// <reference path="../.astro/types.d.ts" />
/// <reference types="@astrojs/cloudflare" />

interface ImportMetaEnv {
  readonly ANTHROPIC_API_KEY: string;
  readonly ANTHROPIC_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type Runtime = import('@astrojs/cloudflare').Runtime<{
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL?: string;
  ANALYTICS_KV?: KVNamespace;
  STATS_TOKEN?: string;
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