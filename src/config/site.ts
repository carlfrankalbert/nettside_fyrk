/**
 * Site configuration constants
 */
export const SITE_CONFIG = {
  name: 'Fyrk',
  url: 'https://fyrk.no',
  description: 'Fyrk lager verktøy og korte tekster for bedre produktbeslutninger.',
  locale: 'nb_NO',
  defaultImage: '/og-image.png',
  favicon: '/fyrk-monogram-primary-navy.svg',
} as const;

export type SiteConfig = typeof SITE_CONFIG;


