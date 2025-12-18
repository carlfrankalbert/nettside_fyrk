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
  { href: '#om', label: 'Om' },
  { href: '#verktoy', label: 'Verktøy' },
  { href: '#kontakt', label: 'Kontakt' },
] as const;

/**
 * Hero section content
 */
export const heroContent = {
  tagline: 'Når hverdagen er kompleks og kravene mange',
  headline: 'Produktledelse som gjør strategi til handling',
  description: 'FYRK hjelper team som vil levere, ikke bare planlegge. Med struktur som tåler endringer uten å miste fart.',
  subDescription: 'Ofte brukt når strategi er vedtatt, men prioriteringer og leveranse fortsatt spriker.',
  ctaText: 'Kontakt FYRK',
  ctaHref: '#kontakt',
} as const;

/**
 * Situations where FYRK can help
 */
export const situationsContent = {
  title: 'FYRK hjelper når',
  situations: [
    'Teamet har mange parallelle initiativer – og ingenting får fullt fokus',
    'Strategi finnes, men påvirker ikke prioriteringer i praksis',
    'Smidige metoder følges, men gir lite reell effekt',
    'Kvalitet fanges for sent i prosessen og skaper unødvendig friksjon',
  ],
} as const;

/**
 * Core competencies section content
 */
export const competenciesContent = {
  title: 'Kjernekompetanse',
  competencies: [
    {
      title: 'Produktledelse',
      description: 'Prioritering, strategi og roadmap som gir teamet retning – slik at dere slipper å diskutere hva som er viktigst hver uke.',
      iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      title: 'Prosessledelse',
      description: 'Arbeidsformer som fjerner flaskehalser og skaper forutsigbarhet. Ikke flere seremonier, men bedre flyt.',
      iconPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    },
    {
      title: 'Kvalitetsledelse',
      description: 'Kvalitet bygget inn fra start, ikke testet inn til slutt. Færre overraskelser, tryggere leveranser.',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ],
} as const;

/**
 * About section content (Hvem står bak) - consolidated with experience and testimonials
 */
export const aboutContent = {
  title: 'Hvem står bak',
  whyFyrk: {
    heading: 'Hvorfor FYRK?',
    paragraphs: [
      'Jeg startet FYRK fordi jeg vil drive forandring og forenkling. For mange team sitter fast i tunge prosesser, uklare prioriteringer og kvalitet som kommer for sent. Det trenger ikke være sånn.',
      'FYRK skal bli et kompetansesenter for smidig produktutvikling med kvalitetsfokus – et sted der erfaring fra komplekse miljøer møter praktisk gjennomføringskraft.',
    ],
  },
  founder: {
    heading: 'Carl Johnson, grunnlegger',
    image: '/images/carl-johnson.png',
    paragraphs: [
      'Jeg hjelper team med å gå fra friksjon til flyt. Det betyr færre overleveringer, mindre rapportering, og mer synlighet – slik at folk kan bruke tiden på det som skaper verdi.',
      'Blir ofte brukt når det trengs tydelige prioriteringer uten å skape unødvendig uro.',
    ],
    experience: '15+ års erfaring med produktledelse, prosessforbedring og kvalitetsarbeid i bank, fintech og offentlig sektor. Har jobbet i og med miljøer som SpareBank 1, Vipps, Varner og Domstolsadministrasjonen, ofte i komplekse og regulerte domener.',
    testimonial: {
      quote: 'Det har vært en fornøyelse å samarbeide med Carl. Han er tydelig, konkret, robust og god til å kommunisere med utviklingsteamet og interessenter rundt teamet. Som produktleder har han vist vei i en reorganisering av et stort team til to mindre team som dekker et komplekst og tungt domene (Betaling). Med høyt arbeidspress, krevende systemavhengigheter kombinert med mange interessenter ute i bank har Carl ledet an skyreisen på en solid måte.',
      role: 'Utviklingsleder',
      company: 'SpareBank 1',
    },
    linkedinCta: {
      text: 'Se komplett CV på LinkedIn',
      href: EXTERNAL_LINKS.linkedinPersonal,
    },
  },
} as const;

/**
 * Tools section content
 */
export const toolsContent = {
  title: 'Verktøy',
  description: 'Praktiske verktøy for bedre arbeid med strategi og mål.',
  intro: 'OKR-sjekken viser hvordan jeg vurderer kvalitet i mål, prioriteringer og strategisk retning.',
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
  description: 'Usikker på hvor du skal starte? En kort samtale avklarer raskt om det er grunnlag for samarbeid. Helt uforpliktende. Ingen salg, bare avklaring.',
  subtitle: '',
  emailHref: EXTERNAL_LINKS.email,
  emailLabel: 'hei@fyrk.no',
  linkedinHref: EXTERNAL_LINKS.linkedin,
  linkedinLabel: 'LinkedIn',
} as const;

/**
 * Footer content
 */
export const footerContent = {
  address: 'c/o Mesh Youngstorget, Møllergata 6, 8, 0179 Oslo',
  orgNumber: '936 630 898',
  emailHref: EXTERNAL_LINKS.email,
  emailLabel: 'Kontakt',
  linkedinHref: EXTERNAL_LINKS.linkedin,
  linkedinLabel: 'LinkedIn',
} as const;
