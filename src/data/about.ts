/**
 * About page content
 * Canonical expanded founder and company content
 *
 * Note: landing.ts has its own shorter teaser version of about/founder content.
 * These are intentionally different — different context, different level of detail.
 */

import { EXTERNAL_LINKS, CONTACT_LABEL } from '../utils/links';

export const aboutPageContent = {
  seo: {
    title: 'Om FYRK',
    description: 'Jeg har bakgrunn som senior produktleder og beslutningsstøtte i komplekse, regulerte miljøer. FYRK er bygget for én ting: å gi deg et bedre grunnlag før du forplikter deg.',
  },
  heading: 'Om FYRK',
  intro: [
    'Jeg har bakgrunn som senior produktleder og beslutningsstøtte i komplekse, regulerte miljøer innen bank og finans, og har jobbet med beslutninger som har hatt betydelige økonomiske og organisatoriske konsekvenser.',
    'FYRK er bygget for én ting: å gi deg et bedre grunnlag før du forplikter deg.',
  ],
  founder: {
    name: 'Carl Johnson, grunnlegger',
    paragraphs: [
      'Jeg hjelper team med å gå fra friksjon til flyt. Det betyr færre overleveringer, mindre rapportering, og mer synlighet – slik at folk kan bruke tiden på det som skaper verdi.',
      'Blir ofte brukt når det trengs tydelige prioriteringer uten å skape unødvendig uro.',
    ],
    experienceHtml: '<span class="font-semibold text-brand-navy">15+ års erfaring</span> med produktledelse, prosessforbedring og kvalitetsarbeid i bank, fintech og offentlig sektor. Tidligere oppdrag inkluderer <span class="font-semibold text-brand-navy">SpareBank 1, Vipps, Varner og Domstolsadministrasjonen</span>, ofte i komplekse og regulerte domener.',
    linkedinCta: {
      text: 'Se komplett CV på LinkedIn',
      href: EXTERNAL_LINKS.linkedinPersonal,
    },
  },
  ctaHref: EXTERNAL_LINKS.email,
  ctaLabel: CONTACT_LABEL,
} as const;
