/**
 * Beslutningslogg tool page content
 */

export const beslutningsloggTool = {
  page: {
    seo: {
      title: 'Beslutningslogg — dokumenter beslutninger strukturert',
      description: 'Dokumenter beslutninger strukturert. Eksporter til Markdown for Notion, Confluence eller GitHub. Ingen registrering.',
    },
    toolName: 'Beslutningslogg',
    breadcrumbLabel: 'Beslutningslogg',
    showClaude: false,
    h1: 'Dokumenter beslutninger med klarhet',
    badge: 'Beta',
    subtitle: 'Fyll inn hva dere har besluttet, hvilke antakelser som ligger til grunn og hva dere vet at dere ikke vet. Få ut en strukturert Markdown-logg du kan lime inn hvor som helst.',
    tagline: 'Ingen AI · Ingen lagring · Eksporter til Notion, Confluence eller GitHub',
    whenToUse: [
      'Etter en viktig produktbeslutning eller prioritering',
      'Når teamet har valgt én vei blant flere alternativer',
      'For å skape sporbarhet og ansvarlighet i beslutninger',
      'Som avslutning etter en refleksjon med <a href="/konseptspeilet" class="text-brand-navy underline underline-offset-2 hover:text-brand-navy/80">Konseptspeilet</a>',
    ],
    benefits: {
      heading: 'Hva får du?',
      items: [
        'En strukturert Markdown-logg du kan lime inn hvor som helst',
        'Tydelig dokumentasjon av beslutning, grunnlag og usikkerhet',
        'Sporbarhet for fremtidig referanse og læring',
      ],
    },
    relatedTools: [
      { name: 'Konseptspeilet', href: '/konseptspeilet', description: 'Test ideen bak beslutningen med AI-drevet refleksjon.' },
      { name: 'OKR-sjekken', href: '/okr-sjekken', description: 'Sjekk kvaliteten på OKR-ene knyttet til beslutningen.' },
    ],
    mobileCTA: { buttonText: 'Lag Markdown', buttonId: 'mobile-generate-btn' },
  },
  ui: {
    beslutningLabel: 'Hva har dere besluttet?',
    beslutningPlaceholder: 'Vi har besluttet å...',
    datoLabel: 'Dato',
    deltakereLabel: 'Deltakere',
    deltakereOptional: '(valgfritt)',
    deltakerePlaceholder: 'F.eks. Produktteam, Leder, Designansvarlig',
    antakelserLabel: 'Kritiske antakelser',
    antakelserOptional: '(valgfritt)',
    antakelserPlaceholder: 'Skriv én antakelse per linje, f.eks:\nMarkedet er stort nok\nBrukerne vil betale for denne funksjonen',
    antakelserHelp: 'Én antakelse per linje',
    usikkerhetLabel: 'Akseptert usikkerhet',
    usikkerhetOptional: '(valgfritt)',
    usikkerhetPlaceholder: 'Hva vet dere at dere ikke vet? F.eks:\nVi vet ikke nøyaktig hvor stor markedsandelen er\nVi har ikke testet prismodellen',
    usikkerhetHelp: 'Én usikkerhet per linje',
    generateButton: 'Lag Markdown',
    previewHeading: 'Forhåndsvisning',
    copyButton: 'Kopier Markdown',
    copiedButton: 'Kopiert!',
    showRawMarkdown: 'Vis rå Markdown',
    editButton: 'Rediger',
    resetButton: 'Start på nytt',
    aboutTool: 'Om dette verktøyet:',
    aboutToolDescription: 'Beslutningsloggen hjelper deg med å dokumentere viktige beslutninger på en strukturert måte. Den genererer Markdown som du kan lime inn i Notion, Confluence, GitHub eller andre verktøy teamet ditt bruker.',
  },
} as const;
