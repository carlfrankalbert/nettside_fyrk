/**
 * Landing page content configuration
 * Centralizes all text content for the landing page
 */

import { EXTERNAL_LINKS, CONTACT_LABEL } from '../utils/links';

/**
 * Navigation links for the landing page
 */
export const navLinks = [
  { href: '/#bidrag', label: 'Hva FYRK bidrar med' },
  { href: '/verktoy', label: 'Verktøy' },
  { href: EXTERNAL_LINKS.email, label: CONTACT_LABEL, isCta: true },
] as const;

/**
 * Hero section content
 */
export const heroContent = {
  headline: 'Senior produktledelse for komplekse og regulerte produktmiljøer.',
  description: [
    'FYRK hjelper produktområder med å få mer struktur, tydeligere prioriteringer og bedre fremdrift.',
    'Når mange hensyn, avhengigheter og team er involvert, kan arbeidet lett stoppe opp mellom produkt, teknologi og forretning. Da trengs det noen som kan skape oversikt, få frem hva som må avklares og hjelpe arbeidet videre.',
  ],
  ctaText: 'Ta kontakt',
  ctaHref: EXTERNAL_LINKS.email,
} as const;

/**
 * Services content used by the /tjenester pages (not rendered on the landing page).
 * The landing page uses contributionsContent + whenFitsContent for positioning.
 */
export const servicesContent = {
  title: 'Tjenester',
  intro: 'FYRK leverer produktledelse og rådgivning til komplekse produktmiljøer. Oppdrag tilpasses behov, fra operativ produktledelse til strukturert rådgivning og sparring.',
  services: [
    {
      title: 'Interim produktleder',
      description: 'Operativt ansvar som produktleder i teamet. Prioritering, stakeholder-håndtering, roadmap og leveranse i komplekse miljøer.',
      fitWhen: 'Teamet trenger en erfaren produktleder på kort varsel, eller noen som kan ta tydelige prioriteringer uten å skape unødvendig uro.',
    },
    {
      title: 'Rådgivning og sparring',
      description: 'Strukturert rådgivning til produktledere, team og ledelse. Hjelp til å få oversikt, prioritere riktig og få fremdrift i arbeid med mange avhengigheter.',
      fitWhen: 'Dere trenger noen utenfra som kan se helheten, stille de riktige spørsmålene og gi konkrete anbefalinger.',
    },
  ],
  footnote: '',
  ctaText: 'Ta kontakt',
  ctaHref: '#kontakt',
} as const;

/**
 * Short introduction under hero
 */
export const introContent = {
  paragraphs: [
    'FYRK jobber med produktledelse og rådgivning i komplekse produktmiljøer.',
    'Typiske situasjoner er uklare prioriteringer, mange avhengigheter, flere team er involvert eller arbeid som stopper opp mellom produkt, teknologi og forretning.',
    'Bidraget handler ofte om å skape bedre oversikt over hva som må avklares, hva som bør prioriteres, hvem som må involveres og hvordan arbeidet kan komme videre.',
  ],
} as const;

/**
 * Contributions section: what FYRK delivers
 */
export const contributionsContent = {
  title: 'Hva FYRK bidrar med',
  intro: 'FYRK hjelper produktområder med å få bedre oversikt, tydeligere prioriteringer og mer fremdrift når mange team, avhengigheter og beslutninger påvirker arbeidet.',
  items: [
    'Produktledelse i komplekse miljøer',
    'Strukturering av roadmap og prioriteringer',
    'Bedre flyt mellom produkt, teknologi og forretning',
    'Støtte til produktledere, team og ledelse',
    'Fremdrift i arbeid med mange avhengigheter',
    'Tydeligere beslutningsgrunnlag og gjennomføring',
  ],
} as const;

/**
 * When FYRK fits: situational fit
 */
export const whenFitsContent = {
  title: 'Når FYRK passer',
  statement: 'FYRK passer best når produktmiljøet har mange flinke folk, men for lav fremdrift.',
  lead: 'Typiske situasjoner:',
  items: [
    'Prioriteringer er uklare eller endres ofte',
    'Viktige avklaringer blir liggende for lenge',
    'Produkt, teknologi og forretning trekker ikke tydelig nok i samme retning',
    'Et område trenger mer struktur i roadmap, ansvar og beslutninger',
    'Ledelsen trenger bedre oversikt over hva som faktisk stopper arbeidet',
  ],
} as const;

/**
 * Experience section content
 */
export const experienceContent = {
  title: 'Erfaring',
  lead: 'FYRK bygger på erfaring fra bank, digitale finansielle tjenester, retail og offentlig sektor.',
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
 * About section content (short profile)
 */
export const aboutContent = {
  title: 'Om Carl Johnson',
  founder: {
    heading: 'Om Carl Johnson',
    paragraphs: [
      'Carl Johnson er produktleder og rådgiver med erfaring fra bank, digitale finansielle tjenester og offentlig sektor.',
      'Han jobber best i komplekse produktmiljøer der det er behov for mer struktur, tydeligere prioriteringer og bedre fremdrift.',
      'Bakgrunnen spenner fra test og kvalitet til team- og produktledelse, med praktisk erfaring fra tverrfaglige team, digitale produkter og regulerte miljøer.',
      'Han trives best i situasjoner der det er viktig å forstå helheten, rydde i uklarhet og få arbeidet videre.',
    ],
    linkedinCta: {
      text: 'Se full CV på LinkedIn',
      href: EXTERNAL_LINKS.linkedinPersonal,
    },
  },
} as const;

/**
 * Testimonials section content
 */
export const testimonialsContent = {
  title: 'Hva tidligere kolleger og samarbeidspartnere sier',
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
 * Contact section content
 */
export const contactContent = {
  title: 'Kontakt FYRK',
  description: 'Har dere et produktområde der fremdriften stopper opp mellom prioriteringer, avhengigheter og beslutninger? En kort samtale er ofte nok til å avklare om det er en match.',
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
  { href: '/#bidrag', label: 'Hva FYRK bidrar med' },
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
