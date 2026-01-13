/**
 * Link utility functions and constants
 */

export const EXTERNAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/fyrk/',
  linkedinPersonal: 'https://www.linkedin.com/in/carlfajohnson/',
  site: 'https://fyrk.no',
  email: 'mailto:hei@fyrk.no',
} as const;

export const INTERNAL_LINKS = {
  home: '/',
  about: '/om',
  blog: '/blogg',
  contact: '/kontakt',
} as const;

/**
 * Standard link classes for consistent styling
 */
export const linkClasses = {
  default: 'text-brand-navy hover:text-brand-cyan-darker transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-brand-cyan-darker focus-visible:ring-offset-2 rounded-md',
  footer: 'text-neutral-100 hover:text-brand-cyan-light transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-brand-cyan-darker focus-visible:ring-offset-2 rounded-md px-1',
  external: 'text-brand-cyan-darker hover:text-brand-cyan transition-colors duration-fast',
} as const;


