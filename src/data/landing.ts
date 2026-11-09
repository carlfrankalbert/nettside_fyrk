/**
 * Landing page content configuration
 * Centralizes all text content for the landing page
 */

import { EXTERNAL_LINKS } from '../utils/links';

/**
 * Navigation links for the landing page
 */
export const navLinks = [
  { href: '/verktoy', label: 'Verktøy' },
  { href: '/innsikt', label: 'Innsikt' },
] as const;

/**
 * Hero section content
 */
export const heroContent = {
  headline: 'Verktøy for bedre produktbeslutninger',
  description: 'Små verktøy som hjelper deg å teste OKR-er, produktideer og beslutninger før teamet bruker tid på dem.',
  ctaText: 'Utforsk verktøyene',
  ctaHref: '#verktoy',
} as const;

/**
 * Tools section on the front page (tool list itself lives in data/verktoy.ts)
 */
export const toolsSectionContent = {
  id: 'verktoy',
  title: 'Verktøyene',
} as const;

/**
 * Latest insight texts on the front page
 */
export const insightsSectionContent = {
  title: 'Innsikt',
  intro: 'Korte tekster om produktledelse, prioritering og beslutninger.',
  limit: 3,
} as const;

/**
 * About section: who makes this and why
 */
export const aboutContent = {
  id: 'om',
  title: 'Om FYRK',
  paragraphs: [
    'FYRK er et hobbyprosjekt av Carl Johnson, med verktøy og tekster om produktledelse, prioritering og beslutninger.',
    'Verktøyene er laget for å gjøre det lettere å tenke tydelig før man forplikter seg. De bruker AI, men erstatter ikke egen vurdering.',
    'Tilbakemeldinger og ideer til nye verktøy er velkomne på hei@fyrk.no.',
  ],
} as const;

/**
 * Footer navigation links
 */
export const footerNavLinks = [
  { href: '/verktoy', label: 'Verktøy' },
  { href: '/innsikt', label: 'Innsikt' },
  { href: EXTERNAL_LINKS.linkedin, label: 'LinkedIn', external: true },
  { href: '/personvern', label: 'Personvern' },
  { href: '/vilkar', label: 'Vilkår' },
] as const;

/**
 * Footer content
 */
export const footerContent = {
  orgNumber: '936 630 898',
} as const;
