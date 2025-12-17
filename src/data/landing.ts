/**
 * Landing page content configuration
 * Centralizes all text content for the landing page
 */

import { EXTERNAL_LINKS } from '../utils/links';
import { PAGE_ROUTES } from '../utils/constants';

/**
 * Navigation links for the landing page
 */
export const navLinks = [
  { href: '#om', label: 'Om oss' },
  { href: '#verktoy', label: 'Verktøy' },
  { href: '#kontakt', label: 'Kontakt' },
] as const;

/**
 * Hero section content
 */
export const heroContent = {
  tagline: 'Rådgivning · Produktstrategi · OKR',
  headline: 'Produktledelse som gjør strategi til handling',
  description: 'FYRK hjelper team som vil levere, ikke bare planlegge. Med struktur som tåler endringer uten å miste fart.',
  ctaText: 'Book en gratis samtale',
  ctaHref: '#kontakt',
  secondaryCtaText: 'Prøv OKR-sjekken gratis',
  secondaryCtaHref: PAGE_ROUTES.OKR_REVIEWER,
} as const;

/**
 * Situations where FYRK can help
 */
export const situationsContent = {
  title: 'FYRK hjelper når',
  situations: [
    'Teamet har mange parallelle initiativ og mangler retning',
    'Strategi ligger i dokumenter, men ikke i hverdagen',
    'Smidige metoder føles som seremonier uten effekt',
    'Kvalitet lider fordi QA kommer for sent i prosessen',
  ],
} as const;

/**
 * About section content
 */
export const aboutContent = {
  title: 'Om FYRK',
  description: 'FYRK bygger på erfaring fra produktutvikling, smidig ledelse og kvalitetssikring. Oppdraget tilpasses alltid: fra sparring og rådgivning til tettere samarbeid, alene eller med utvalgte partnere.',
  subtitle: 'AI brukes som støtteverktøy for innsikt og raskere testing av antakelser.',
  competencyTitle: 'Kjernekompetanse',
  competencies: [
    {
      title: 'Produktstrategi',
      description: 'Prioritering som sikrer reell verdi, så teamet jobber med det som faktisk betyr noe.',
      iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      title: 'Prosessledelse',
      description: 'Smidige arbeidsformer med flyt. Færre flaskehalser og mer forutsigbar fremdrift.',
      iconPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    },
    {
      title: 'Kvalitetsledelse',
      description: 'Kvalitet og QA fra idéfasen. Færre overraskelser og tryggere leveranser.',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ],
} as const;

/**
 * Tools section content
 */
export const toolsContent = {
  title: 'Verktøy',
  description: 'Praktiske verktøy for bedre arbeid med strategi og mål.',
  tools: [
    {
      title: 'OKR-sjekken',
      description: 'Få et raskt, strukturert blikk på kvaliteten i OKR-ene deres. Uten workshop, styringsgrupper eller lange dokumenter.',
      href: PAGE_ROUTES.OKR_REVIEWER,
      buttonText: 'Prøv OKR-sjekken',
    },
  ],
  comingSoonText: 'Flere verktøy er på vei. Følg med.',
} as const;

/**
 * Contact section content
 */
export const contactContent = {
  title: 'Ta kontakt',
  description: 'Usikker på hvor du skal starte? En kort samtale avklarer raskt om det er grunnlag for samarbeid.',
  subtitle: 'Helt uforpliktende. Ingen salg, bare avklaring.',
  emailHref: EXTERNAL_LINKS.email,
  emailLabel: 'hei@fyrk.no',
  linkedinHref: EXTERNAL_LINKS.linkedin,
  linkedinLabel: 'LinkedIn',
} as const;

/**
 * Footer content
 */
export const footerContent = {
  address: 'c/o MESH, Møllergata 6, 0179 Oslo',
  orgNumber: '936 630 898',
  emailHref: EXTERNAL_LINKS.email,
  emailLabel: 'Kontakt',
  linkedinHref: EXTERNAL_LINKS.linkedin,
  linkedinLabel: 'LinkedIn',
} as const;
