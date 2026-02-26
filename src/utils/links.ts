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

/** Phone number split into parts for bot-scraping obfuscation — assembled client-side */
export const PHONE_PARTS = ['929', '11', '929'] as const;
export const PHONE_COUNTRY = '+47' as const;

/** Approved contact CTA label — use this instead of hardcoding "Ta kontakt" */
export const CONTACT_LABEL = 'Ta kontakt' as const;
