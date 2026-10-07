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
  lead: 'FYRK tilbyr interim produktledere og leveranseledere til produktområder i bank, betaling og andre regulerte virksomheter.',
} as const;

/**
 * Consultant profile (short bio)
 */
export const consultantContent = {
  title: 'Carl Johnson',
  consultant: {
    heading: 'Carl Johnson',
    role: 'Interim produktleder og leveranseleder',
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
      text: 'Se profil på LinkedIn',
      href: EXTERNAL_LINKS.linkedinPersonal,
    },
  },
} as const;

/**
 * Carl's background from earlier roles (not FYRK assignments)
 */
export const backgroundContent = {
  title: 'Carls bakgrunn',
  lead: 'Erfaringen under er fra Carls roller før FYRK, hovedsakelig i bank og betaling.',
  entries: [
    {
      company: 'SpareBank 1 Utvikling',
      role: 'Produktleder – Mobilbank Bedrift',
      period: '2024–2025',
      description: 'Ansvar for prioritering, retning og leveranser i teamet, i tett samarbeid med teknologi, design og andre fagmiljøer. Fra januar 2025 ble produktlederansvaret utvidet til tre team: Mobilbank Bedrift, Betaling og Transaksjoner. I perioden ble betalingsplattformen for over 100 000 bedriftskunder migrert, og bruken av Mobilbank Bedrift økte med om lag 40 prosent på halvannet år. SpareBank 1 lanserte biometrisk signering av betaling som første bank i Norge.',
    },
    {
      company: 'SpareBank 1 Utvikling',
      role: 'Områdeleder – Kundedialog',
      period: '2022–2023',
      description: 'Ansvar for to tverrfaglige team, bemanning, leveranser og budsjett på om lag 18–20 MNOK. Fulgte opp flere prosjekter og initiativer innenfor området som del av budsjett- og leveranseansvaret, blant annet som prosjektleder for et møtebookingprosjekt på om lag 3 MNOK. Overtok i perioden også produktlederansvaret for begge teamene.',
    },
    {
      company: 'SpareBank 1 Utvikling',
      role: 'Testleder og releaseleder – Nettsider',
      period: '2019–2021',
      description: 'Ansvar for test og release i teamet som utviklet bankens nettsider og CMS. Ryddet en backlog på 200–300 saker til et håndterbart nivå, samlet flere backlogs til én og bidro til hyppigere releaser.',
    },
    {
      company: 'Varner',
      role: 'Testleder',
      period: '2019',
      description: 'Testleder i utviklingen av ny e-handelsplattform. Koordinerte testing på tvers av fire team.',
    },
    {
      company: 'Vipps',
      role: 'Testleder',
      period: '2018–2019',
      description: 'Ansvar for kvalitet og teststrategi for mobile plattformer i iOS og Android.',
    },
    {
      company: 'Domstoladministrasjonen',
      role: 'Testleder, digitalisering',
      period: '2018',
      description: 'Testleder i digitaliseringsprosjekt for norske domstoler med koordinering mot politiet og kriminalomsorgen.',
    },
    {
      company: 'SpareBank 1',
      role: 'Testleder – Mobilbank',
      period: '2014–2018',
      description: 'Var med på å endre leveransetakten fra rundt fire releaser i året til ukentlige releaser, blant annet ved å flytte testing tidligere i utviklingsløpet og tettere på utviklingen, helt ned på pull requests. Testgjennomløpet gikk fra rundt én uke til noen timer.',
    },
  ],
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
