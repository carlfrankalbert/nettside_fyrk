/**
 * Landing page content configuration
 * Centralizes all text content for the landing page
 */

import { EXTERNAL_LINKS, CONTACT_LABEL } from '../utils/links';

/**
 * Navigation links for the landing page
 */
export const navLinks = [
  { href: '/tjenester', label: 'Tjenester' },
  { href: '/verktoy', label: 'Verktøy' },
  { href: EXTERNAL_LINKS.email, label: CONTACT_LABEL, isCta: true },
] as const;

/**
 * Hero section content
 */
export const heroContent = {
  headline: 'Tydeligere beslutningsgrunnlag. Operativ kapasitet.',
  description: 'Rådgivning før viktige beslutninger – eller operativt ansvar når dere trenger forsterkning.',
  subDescription: 'Én ansvarlig rådgiver. Senior erfaring. Ingen mellomledd.',
  ctaText: 'Se tjenester',
  ctaHref: '/tjenester',
} as const;

/**
 * Two modes section content
 */
export const modesContent = {
  title: 'To måter å jobbe på',
  intro: 'FYRK kan brukes ulikt avhengig av behov. Beslutningsgjennomgang kan også være første trinn før et operativt oppdrag.',
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
  footnote: 'Typisk effekt: spissede prioriteringer, færre parallelle initiativ og tydeligere eierskap til beslutninger.',
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
      ctaText: 'Les mer om beslutningsgjennomgang',
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
 * Tools showcase section content
 */
export const toolsContent = {
  title: 'Gratis verktøy',
  intro: 'Strukturerte verktøy som hjelper deg se tydeligere før du forplikter deg. Ingen innlogging.',
  tools: [
    {
      name: 'Konseptspeilet',
      description: 'Avdekker blindsoner og skjulte antakelser i produktideer.',
      href: '/konseptspeilet',
      ctaText: 'Prøv konseptspeilet',
    },
    {
      name: 'Antakelseskartet',
      description: 'Gjør implisitte antakelser eksplisitte i beslutninger.',
      href: '/antakelseskart',
      ctaText: 'Prøv antakelseskartet',
    },
    {
      name: 'OKR-sjekken',
      description: 'Rask kvalitetssjekk av OKR-ene dine på under ett minutt.',
      href: '/okr-sjekken',
      ctaText: 'Prøv OKR-sjekken',
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
      'FYRK er bygget på én overbevisning: bedre beslutninger gir bedre resultater. Ikke flere prosesser, ikke flere verktøy — men tydeligere grunnlag for de valgene som faktisk betyr noe.',
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
 * Contact section content
 */
export const contactContent = {
  title: CONTACT_LABEL,
  description: 'Usikker på hvor du skal starte? Kort, uforpliktende avklaringssamtale – 30 minutter. Jeg kartlegger situasjonen og avklarer om det er grunnlag for videre dialog.',
  emailHref: EXTERNAL_LINKS.email,
  emailLabel: CONTACT_LABEL,
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
  emailLabel: CONTACT_LABEL,
  linkedinHref: EXTERNAL_LINKS.linkedin,
  linkedinLabel: 'LinkedIn',
} as const;
