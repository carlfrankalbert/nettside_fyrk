/**
 * Landing page content configuration
 * Centralizes all text content for the landing page
 */

import { EXTERNAL_LINKS, CONTACT_LABEL } from '../utils/links';

/**
 * Navigation links for the landing page
 */
export const navLinks = [
  { href: '/#tjenester', label: 'Tjenester' },
  { href: '/verktoy', label: 'Verktøy' },
  { href: EXTERNAL_LINKS.email, label: CONTACT_LABEL, isCta: true },
] as const;

/**
 * Hero section content
 */
export const heroContent = {
  headline: 'Senior produktledelse for regulerte bransjer.',
  description: 'Jeg går inn i team som produktleder eller produktcoach når mye er i gang, men for lite faktisk kommer helt ut i produksjon.',
  ctaText: 'Ta kontakt',
  ctaHref: EXTERNAL_LINKS.email,
} as const;

/**
 * Services section content
 * 2 core services
 */
export const servicesContent = {
  title: 'Hva jeg gjør',
  intro: 'FYRK hjelper når teamet har mye på gang men lite som faktisk kommer i produksjon, når prioriteringene er uklare, eller når det trengs en erfaren produktleder som kan ta ansvar og skape fremdrift.',
  services: [
    {
      title: 'Interim produktleder',
      description: 'Jeg tar operativt ansvar som produktleder eller produkteier i teamet ditt. Prioritering, stakeholder-håndtering, roadmap og leveranse i komplekse, regulerte miljøer.',
      fitWhen: 'Teamet trenger en erfaren produktleder på kort varsel, eller noen som kan ta harde prioriteringer uten å skape unødvendig uro.',
    },
    {
      title: 'Produktcoaching',
      description: 'Jeg coacher produktledere og produktteam som vil bli bedre på prioritering, målstyring og datadrevne beslutninger. Basert på 15 års praksis i regulerte bransjer. Inkluderer arbeid med OKR-rammeverk og AI-støttet produktutvikling der det er relevant.',
      fitWhen: 'Dere har produktledere som trenger sparring og utvikling, eller team som skal gå fra prosjekt- til produkttankegang.',
    },
  ],
  footnote: '',
  ctaText: 'Ta kontakt',
  ctaHref: '#kontakt',
} as const;

/**
 * About section content
 */
export const aboutContent = {
  title: 'Om Carl Johnson',
  founder: {
    heading: 'Om Carl Johnson',
    image: '/images/carl-johnson.jpg',
    paragraphs: [
      'Jeg har 15+ års erfaring fra bank, fintech og offentlig sektor, blant annet SpareBank 1 Utvikling, Vipps, Varner og Domstoladministrasjonen.',
      'Jeg startet i test og kvalitet, og har jobbet meg til produktledelse og strategi. Det betyr at jeg forstår hele kjeden fra kode til forretning, og vet hva som skal til for å faktisk levere i regulerte omgivelser der compliance og fart må fungere sammen.',
      'I dag driver jeg FYRK. Jeg tar oppdrag som interim produktleder, produktcoach og rådgiver. Jeg bruker AI aktivt i produktarbeidet, til research, testing av antakelser og raskere beslutningsgrunnlag.',
      'Jeg liker å løse problemer og har lite tålmodighet for arbeid som ikke skaper verdi.',
    ],
    linkedinCta: {
      text: 'Se full CV på LinkedIn',
      href: EXTERNAL_LINKS.linkedinPersonal,
    },
  },
} as const;

/**
 * Selected experience section content
 */
export const experienceContent = {
  title: 'Utvalgt erfaring',
  entries: [
    {
      company: 'SpareBank 1 Utvikling',
      role: 'Produktleder, mobilbank bedrift',
      description: 'Produktleder for mobilbank og betaling i bedriftsmarkedet. Ledet tre tverrfaglige team med ansvar for strategi, prioritering og leveranser.',
    },
    {
      company: 'Vipps',
      role: 'Kvalitet og teststrategi',
      description: 'Ansvar for kvalitet og teststrategi for mobile plattformer i iOS og Android.',
    },
    {
      company: 'Domstoladministrasjonen',
      role: 'Testleder, digitalisering',
      description: 'Testleder i digitaliseringsprosjekt for norske domstoler med koordinering mot politiet og kriminalomsorgen.',
    },
    {
      company: 'Varner',
      role: 'Testleder og produkteier',
      description: 'Testleder og produkteier i utviklingen av ny e-handelsplattform. Koordinerte testing og prioritering på tvers av fire team.',
    },
  ],
} as const;

/**
 * Testimonials section content
 */
export const testimonialsContent = {
  title: 'Hva folk jeg har jobbet med sier',
  testimonials: [
    {
      highlight: 'Tydelig, konkret, robust og god til å kommunisere.',
      quote: 'Som produktleder har han vist vei i en reorganisering av et stort team til to mindre team som dekker et komplekst og tungt domene. Med høyt arbeidspress og krevende systemavhengigheter har Carl ledet an på en solid måte.',
      role: 'Utviklingsleder',
      company: 'SpareBank 1 Utvikling',
    },
    {
      highlight: 'Tok de harde, men nødvendige, prioriteringene.',
      quote: 'Han bidro til mindre forstyrrelser og tydeligere fokus for gruppa, og var pådriver for en fornuftig bruk av OKR-er og Definition of Done.',
      role: 'Senior Tech Lead',
      company: 'SpareBank 1 Utvikling',
    },
  ],
} as const;

/**
 * Tools showcase section content
 */
export const toolsContent = {
  title: 'Gratis verktøy',
  intro: 'Strukturerte verktøy som hjelper deg tenke tydeligere. Ingen innlogging.',
  tools: [
    {
      name: 'Konseptspeilet',
      description: 'Avdekker blindsoner i produktideer.',
      href: '/konseptspeilet',
      ctaText: 'Prøv konseptspeilet',
    },
    {
      name: 'OKR-sjekken',
      description: 'Rask kvalitetssjekk av OKR-ene dine.',
      href: '/okr-sjekken',
      ctaText: 'Prøv OKR-sjekken',
    },
  ],
} as const;

/**
 * Contact section content
 */
export const contactContent = {
  title: 'La oss snakke.',
  description: 'En kort samtale er ofte nok til å avklare om det er en match. Ingen forpliktelse.',
  emailHref: EXTERNAL_LINKS.email,
  emailLabel: 'Send e-post',
  linkedinHref: EXTERNAL_LINKS.linkedinPersonal,
  linkedinLabel: 'LinkedIn',
  phoneLabel: 'Ring direkte',
} as const;

/**
 * Footer navigation links
 */
export const footerNavLinks = [
  { href: '/#tjenester', label: 'Tjenester' },
  { href: '/verktoy', label: 'Verktøy' },
  { href: EXTERNAL_LINKS.linkedinPersonal, label: 'LinkedIn', external: true },
  { href: '/personvern', label: 'Personvern' },
  { href: '/vilkar', label: 'Vilkår' },
] as const;

/**
 * Footer content
 */
export const footerContent = {
  address: 'c/o Mesh Youngstorget, Møllergata 6, 0179 Oslo',
  orgNumber: '936 630 898',
  registration: 'Godkjent bemanningsforetak',
} as const;
