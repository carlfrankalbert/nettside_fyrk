/// <reference path="../.astro/types.d.ts" />

// Netlify form attributes
declare global {
  namespace astroHTML.JSX {
    interface IntrinsicElements {
      form: astroHTML.JSX.HTMLAttributes<HTMLFormElement> & {
        netlify?: boolean;
        'netlify-honeypot'?: string;
      };
    }
  }
}

// Netlify form attributes
declare namespace astroHTML.JSX {
  interface FormHTMLAttributes {
    netlify?: boolean;
    'netlify-honeypot'?: string;
  }
}