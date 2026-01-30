/**
 * Link constants — single source of truth for all URLs and contact labels.
 * See docs/design-contract.md for usage rules.
 */

export const EXTERNAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/fyrk/',
  linkedinPersonal: 'https://www.linkedin.com/in/carlfajohnson/',
  site: 'https://fyrk.no',
  email: 'mailto:hei@fyrk.no',
} as const;

/** Approved contact CTA label — use this instead of hardcoding "Ta kontakt" */
export const CONTACT_LABEL = 'Ta kontakt' as const;
