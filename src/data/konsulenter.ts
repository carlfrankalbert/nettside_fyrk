/**
 * Konsulenter page content configuration
 * Centralizes all text content for the consultants page
 */

import { EXTERNAL_LINKS } from '../utils/links';

/**
 * Page header content
 */
export const konsulenterHeader = {
  title: 'Konsulenter',
  lead: 'FYRK tilbyr senior kompetanse innen produktledelse og operativ rådgivning i komplekse og regulerte produktmiljøer.',
} as const;

/**
 * Consultant profile (short bio)
 */
export const consultantContent = {
  title: 'Carl Johnson',
  consultant: {
    heading: 'Carl Johnson',
    role: 'Senior produktleder og operativ rådgiver',
    paragraphs: [
      'Carl har erfaring fra bank, fintech, retail og offentlig sektor, blant annet fra SpareBank 1, Vipps, Varner og Domstoladministrasjonen.',
      'Han arbeider særlig med produktområder der mange team, avhengigheter og hensyn gjør prioritering og gjennomføring krevende.',
      'Bakgrunnen spenner fra kvalitet og leveranse til team- og produktledelse, med praktisk erfaring fra komplekse digitale produkter og regulerte miljøer.',
    ],
    expertise: {
      label: 'Kompetanseområder',
      items: [
        'Produktledelse',
        'Prioritering',
        'Roadmap',
        'Teamledelse',
        'Produktutvikling',
        'Kvalitet og leveranse',
        'Komplekse avhengigheter',
      ],
    },
    linkedinCta: {
      text: 'Se full CV på LinkedIn',
      href: EXTERNAL_LINKS.linkedinPersonal,
    },
  },
} as const;

/**
 * Testimonials section content (LinkedIn recommendations about the consultant)
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
 * Collaboration section: how FYRK scales around assignments
 */
export const collaborationContent = {
  title: 'Samarbeid med FYRK',
  paragraphs: [
    'FYRK samarbeider gjerne med erfarne selvstendige konsulenter og spesialistmiljøer når oppdrag krever bredere kapasitet eller komplementær kompetanse.',
    'Aktuelle samarbeid kan være innen produktledelse, teknologi, design, kvalitet og leveranse.',
  ],
} as const;
