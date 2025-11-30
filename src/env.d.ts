/// <reference path="../.astro/types.d.ts" />

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