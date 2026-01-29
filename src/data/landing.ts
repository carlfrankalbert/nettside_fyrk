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
  { href: '/#tjenester', label: 'Tjenester' },
  { href: '/#om', label: 'Om' },
  { href: '/verktoy', label: 'Verktøy' },
  { href: '/#kontakt', label: 'Kontakt' },
] as const;

/**
 * Hero section content
 */
export const heroContent = {
  tagline: 'FYRK',
  headline: 'Tydeligere beslutningsgrunnlag. Operativ kapasitet.',
  description: 'Rådgivning før viktige beslutninger – eller operativt ansvar når dere trenger forsterkning.',
  subDescription: 'Én ansvarlig rådgiver. Senior erfaring. Ingen mellomledd.',
  ctaText: 'Ta kontakt',
  ctaHref: '#kontakt',
} as const;

/**
 * Choice callout content - 3-line brutal choice logic
 */
export const choiceCalloutContent = {
  title: 'Finn riktig tjeneste',
  choices: [
    {
      condition: 'Har dere én konkret beslutning med reell risiko?',
      action: 'Beslutningsgjennomgang',
      href: '/tjenester/beslutningsgjennomgang',
    },
    {
      condition: 'Mangler dere produktleder- eller teamledelseskapasitet i en periode?',
      action: 'Interim produktleder',
      href: '/tjenester/interim-produktleder',
    },
    {
      condition: 'Stopper leveranser opp pga. friksjon, kvalitet eller uklar flyt?',
      action: 'Kvalitet og leveranseledelse',
      href: '/tjenester/kvalitet-og-leveranseledelse',
    },
  ],
} as const;

/**
 * Two modes section content
 */
export const modesContent = {
  title: 'To måter å jobbe på',
  intro: 'Typisk effekt: spissede prioriteringer, færre parallelle initiativ og tydeligere eierskap til beslutninger. FYRK kan brukes ulikt avhengig av behov – beslutningsgjennomgang kan også være første trinn før et operativt oppdrag.',
  modes: [
    {
      title: 'Beslutningsklarhet',
      subtitle: 'Rådgivning',
      description: 'Strukturert gjennomgang av én konkret beslutning. Lav forpliktelse, fast format.',
      characteristics: [
        'Avgrenset oppdrag (typisk 1–3 uker)',
        'Fast pris avtales på forhånd',
        'Du får rapport med antakelser, risiko og anbefalinger',
        'Beslutningen er fortsatt deres',
      ],
      isHighlight: true,
    },
    {
      title: 'Leveranse og ledelse',
      subtitle: 'Operativ rolle',
      description: 'Midlertidig ansvar i team som produktleder, kvalitetsleder eller teamleder.',
      characteristics: [
        'Lengre oppdrag (typisk 3–6 mnd)',
        'Time- eller fastpris per periode',
        'Jeg tar operativt ansvar, ikke bare rådgivning',
        'Planlagt overlevering og exit-plan',
      ],
      isHighlight: false,
    },
  ],
  footnote: '',
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
 * Services section content
 * Beslutningsgjennomgang is primary, others are secondary
 */
export const servicesContent = {
  title: 'Tjenester',
  services: [
    {
      title: 'Beslutningsgjennomgang',
      description: 'Klarhet før du forplikter deg.',
      details: 'En strukturert gjennomgang av én konkret beslutning – fra antakelser til tydelig anbefaling.',
      href: '/tjenester/beslutningsgjennomgang',
      ctaText: 'Les hvordan beslutningsgjennomgangen fungerer',
      isPrimary: true,
      // Target/checkmark icon - decision quality
      iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
    {
      title: 'Interim produktleder',
      description: 'Senior produktledelse når dere trenger det.',
      details: 'For team som trenger erfaren produktleder på kort varsel.',
      href: '/tjenester/interim-produktleder',
      ctaText: 'Les mer',
      isPrimary: false,
      // Chart/strategy icon
      iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      title: 'Kvalitet og leveranseledelse',
      description: 'Kontroll på flyt, kvalitet og leveranser i komplekse miljøer.',
      details: 'For organisasjoner som vil ha struktur uten å miste fart.',
      href: '/tjenester/kvalitet-og-leveranseledelse',
      ctaText: 'Les mer',
      isPrimary: false,
      // Quality checkmark icon
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ],
} as const;

/**
 * Core competencies section content (legacy, kept for reference)
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
    heading: 'Om FYRK',
    paragraphs: [
      'Jeg har bakgrunn som senior produktleder og beslutningsstøtte i komplekse, regulerte miljøer innen bank og finans, og har jobbet med beslutninger som har hatt betydelige økonomiske og organisatoriske konsekvenser.',
      'FYRK tilbyr tre ulike tjenester – beslutningsgjennomgang, interim produktledelse og kvalitetsledelse. De løser forskjellige problemer og trenger ikke presses inn under én merkelapp.',
    ],
  },
  founder: {
    heading: 'Carl Johnson, grunnlegger',
    image: '/images/carl-johnson.png',
    paragraphs: [
      'Jeg hjelper team med å gå fra friksjon til flyt. Det betyr færre overleveringer, mindre rapportering, og mer synlighet – slik at folk kan bruke tiden på det som skaper verdi.',
      'Blir ofte brukt når det trengs tydelige prioriteringer uten å skape unødvendig uro.',
    ],
    experience: 'Bakgrunn fra bl.a. SpareBank 1, Vipps og offentlig sektor. Lang erfaring med å skape struktur som tåler endring – i komplekse, regulerte miljøer.',
    linkedinCta: {
      text: 'Se komplett CV på LinkedIn',
      href: EXTERNAL_LINKS.linkedinPersonal,
    },
  },
} as const;

/**
 * Tool definition with optional feature toggle
 */
export interface ToolDefinition {
  title: string;
  description: string;
  href: string;
  buttonText: string;
  /** If set, tool is only shown when this feature is enabled */
  featureId?: string;
  /** If true, shows a beta badge */
  isBeta?: boolean;
  /** SVG path for the tool icon */
  iconPath?: string;
}

/**
 * Tools section content
 */
export const toolsContent = {
  title: 'Verktøy',
  description: 'Gratis verktøy som gir deg en smakebit på arbeidsformen. For beslutninger med større konsekvenser, ta kontakt.',
  tools: [
    {
      title: 'OKR-sjekken',
      description: 'Få et raskt, strukturert blikk på kvaliteten i OKR-ene deres. Uten workshop, styringsgrupper eller lange dokumenter.',
      href: PAGE_ROUTES.OKR_REVIEWER,
      buttonText: 'Prøv OKR-sjekken',
      featureId: 'okr-sjekken',
      // Target icon - goals and objectives
      iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    },
    {
      title: 'Konseptspeilet',
      description: 'Et rolig refleksjonsverktøy for produktkonsepter – hjelper deg se hva du vet, hva du antar, og hva du kanskje vil utforske først.',
      href: PAGE_ROUTES.KONSEPTSPEIL,
      buttonText: 'Prøv konseptspeilet',
      featureId: 'konseptspeilet',
      isBeta: true,
      // Lightbulb icon - insight and ideas
      iconPath: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z',
    },
    {
      title: 'Antakelseskartet',
      description: 'Avdekker implisitte antakelser i produkt- og strategibeslutninger. Hjelper deg identifisere hva som bør testes først.',
      href: PAGE_ROUTES.ANTAKELSESKART,
      buttonText: 'Prøv antakelseskartet',
      featureId: 'antakelseskart',
      isBeta: true,
      // Search/magnify icon - uncovering hidden assumptions
      iconPath: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    },
    {
      title: 'Beslutningsloggen',
      description: 'Dokumenter beslutninger med klarhet. Fyll inn hva dere besluttet, hvilke antakelser som ligger til grunn, og eksporter som Markdown.',
      href: PAGE_ROUTES.BESLUTNINGSLOGG,
      buttonText: 'Lag beslutningslogg',
      featureId: 'beslutningslogg',
      isBeta: true,
      // Document with checkmark - documented decisions
      iconPath: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm10.97-6.83l-4.24 4.24-2.12-2.12-1.41 1.41 3.54 3.54 5.65-5.66-1.42-1.41z',
    },
    {
      title: 'Pre-Mortem Brief',
      description: 'Tenk gjennom hva som kan gå galt før du tar irreversible beslutninger. Få failure modes, varselsignaler og stopp-kriterier.',
      href: PAGE_ROUTES.PRE_MORTEM,
      buttonText: 'Lag Pre-Mortem Brief',
      featureId: 'pre-mortem',
      isBeta: true,
      // Shield with exclamation - risk prevention and protection
      iconPath: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
    },
  ] as ToolDefinition[],
  comingSoonText: 'Flere verktøy er på vei. Følg med.',
} as const;

/**
 * Contact section content
 */
export const contactContent = {
  title: 'Ta kontakt',
  description: 'Usikker på hvor du skal starte? Kort, uforpliktende avklaringssamtale – 30 minutter. Ingen salg, bare avklaring.',
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
