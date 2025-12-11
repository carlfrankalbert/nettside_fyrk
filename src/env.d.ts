/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly ANTHROPIC_API_KEY: string;
  readonly ANTHROPIC_MODEL?: string;
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