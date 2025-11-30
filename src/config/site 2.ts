/**
 * Site configuration constants
 */
export const SITE_CONFIG = {
  name: 'Fyrk',
  url: 'https://fyrk.no',
  description: 'Fyrk leverer produktledelse der kvalitet møter forretningsverdi.',
  locale: 'nb_NO',
  defaultImage: '/og-image.png',
  favicon: '/fyrk-monogram-primary-navy.svg',
} as const;

export type SiteConfig = typeof SITE_CONFIG;


