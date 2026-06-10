/**
 * Verktøy overview page content
 * Single source of truth for the tools listing page
 */

export const verktoyPageContent = {
  seo: {
    title: 'Verktøy for klarere produktbeslutninger',
    description: 'Enkle verktøy for produktledere som vil teste OKR-er, produktideer og beslutninger før teamene bruker kapasitet.',
  },
  title: 'Verktøy',
  subtitle: 'Tenk tydeligere før du forplikter deg.',
  tagline: 'Ingen innlogging. Ingen data lagres.',
  sections: [
    {
      heading: 'Refleksjon og analyse',
      tools: [
        {
          name: 'Konseptspeilet',
          description: 'Avdekker blindsoner, implisitte antakelser og logiske hull i produktideen din. Før du investerer tid i den.',
          href: '/konseptspeilet',
          cta: 'Speil konseptet ditt',
        },
        {
          name: 'OKR-sjekken',
          description: 'Lim inn OKR-settet ditt og få konkret tilbakemelding på målbarhet, ambisjonsnivå og kobling til Objective. På under ett minutt.',
          href: '/okr-sjekken',
          cta: 'Sjekk OKR-ene dine',
        },
      ],
    },
    {
      heading: 'Risikoanalyse',
      tools: [
        {
          name: 'Pre-Mortem Brief',
          badge: 'Beta',
          description: 'Beskriv en beslutning du vurderer. Få 5-6 konkrete failure modes, tidlige varselsignaler og stopp-kriterier. Før det er for sent å snu.',
          href: '/verktoy/pre-mortem',
          cta: 'Generer Pre-Mortem Brief',
        },
      ],
    },
  ],
  disclaimerHtml: '',
} as const;
