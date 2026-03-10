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
  description: 'Jeg går inn i teamet ditt som produktleder eller produktcoach — og får ting til å fungere. 15+ års erfaring fra bank, fintech og offentlig sektor.',
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
      description: 'Jeg tar operativt ansvar som produktleder eller produkteier i teamet ditt. Prioritering, stakeholder-håndtering, roadmap og leveranse — i komplekse, regulerte miljøer. Typisk 3–6 måneder med planlagt overlevering.',
      fitWhen: 'Teamet trenger en erfaren produktleder på kort varsel, eller noen som kan ta harde prioriteringer uten å skape unødvendig uro.',
    },
    {
      title: 'Produktcoaching',
      description: 'Jeg coacher produktledere og produktteam som vil bli bedre på prioritering, målstyring og datadrevne beslutninger. Ikke teori fra en lærebok — praksis fra 15 år i regulerte bransjer. Inkluderer arbeid med OKR-rammeverk og AI-støttet produktutvikling der det er relevant.',
      fitWhen: 'Dere har produktledere som trenger sparring og utvikling, eller team som skal gå fra prosjekt- til produkttankegang.',
    },
  ],
} as const;

/**
 * Two modes section content
 */
export const modesContent = {
  title: 'To måter å jobbe på',
  intro: 'FYRK kan brukes ulikt avhengig av behov. Beslutningsgjennomgang kan også være første trinn før et operativt oppdrag.',
  modes: [
    {
      label: 'Rådgivning',
      title: 'Rådgivning',
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
      label: 'Operativ rolle',
      title: 'Leveranse og ledelse',
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
  footnote: 'Typisk effekt: spissede prioriteringer, færre parallelle initiativer og tydeligere eierskap til beslutninger.',
  ctaText: 'Se tjenester',
  ctaHref: '/tjenester',
} as const;

/**
 * About section content
 */
export const aboutContent = {
  title: 'Om Carl Johnson',
  founder: {
    heading: 'Om Carl Johnson',
    image: '/images/carl-johnson.png',
    paragraphs: [
      'Jeg har brukt 15+ år på å lede produktutvikling i noen av Norges mest komplekse digitale miljøer — SpareBank 1 Utvikling, Vipps, Varner og Domstoladministrasjonen.',
      'Jeg startet i test og kvalitet, og jobbet meg opp til produktledelse og strategi. Det betyr at jeg forstår hele kjeden — fra kode til forretning — og vet hva som kreves for å levere i regulerte omgivelser der compliance og fart må fungere sammen.',
      'I dag driver jeg FYRK. Jeg tar oppdrag som interim produktleder, produktcoach og rådgiver. Jeg bruker AI aktivt som arbeidsverktøy i produktarbeidet — til research, testing av antakelser og raskere beslutningsgrunnlag.',
    ],
    certifications: [
      'CSPO (Certified Scrum Product Owner)',
      'CSM (Certified Scrum Master)',
      'AIPO (AI Product Owner)',
      'ISTQB Advanced Test Manager',
    ],
    linkedinCta: {
      text: 'Se arbeidshistorikk og anbefalinger på LinkedIn',
      href: EXTERNAL_LINKS.linkedinPersonal,
    },
  },
} as const;

/**
 * Testimonials section content
 */
export const testimonialsContent = {
  title: 'Hva folk jeg har jobbet med sier',
  testimonials: [
    {
      quote: 'Han er tydelig, konkret, robust og god til å kommunisere med utviklingsteamet og interessenter rundt teamet. Som produktleder har han vist vei i en reorganisering av et stort team til to mindre team som dekker et komplekst og tungt domene. Med høyt arbeidspress, krevende systemavhengigheter kombinert med mange interessenter ute i bank har Carl ledet an skyreisen på en solid måte.',
      name: 'John Rasmus Moen',
      role: 'Utviklingsleder',
      context: 'Jobbet med Carl på samme team',
      situation: 'Teamet hadde mange parallelle initiativer og trengte en produktleder som kunne samle trådene.',
    },
    {
      quote: 'Carl kom inn som Produkteier i mitt team i januar. Han gikk umiddelbart i gang med å ta de harde, men nødvendige, prioriteringene ut mot bank, og innad i teamet, og bidro på den måten til mindre forstyrrelser og tydeligere fokus for gruppa. Videre var Carl pådriver i teamet for en fornuftig bruk av OKR-er og Definition of Done.',
      name: 'Sondre Bjerkerud',
      role: 'Senior Tech Lead and Fullstack Developer',
      context: 'Rapporterte direkte til Carl',
      situation: 'Teamet var i gang med mye, men manglet retning og tydelige prioriteringer.',
    },
  ],
  linkedinHref: EXTERNAL_LINKS.linkedinPersonal,
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
      name: 'Antakelseskartet',
      description: 'Gjør implisitte antakelser eksplisitte.',
      href: '/antakelseskart',
      ctaText: 'Prøv antakelseskartet',
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
  description: 'En kort samtale er ofte nok til å avklare om det er en match. 30 minutter, ingen forpliktelse.',
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
  { href: '/verktoy', label: 'Gratisverktøy' },
  { href: EXTERNAL_LINKS.linkedinPersonal, label: 'LinkedIn', external: true },
  { href: '/personvern', label: 'Personvern' },
  { href: '/vilkar', label: 'Vilkår' },
] as const;

/**
 * Footer content
 */
export const footerContent = {
  companyName: 'FYRK / Carlfrankalbert AS',
  address: 'c/o Mesh Youngstorget, Møllergata 6, 0179 Oslo',
  orgNumber: '936 630 898',
} as const;
