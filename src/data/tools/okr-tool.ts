/**
 * OKR-sjekken tool page content
 */

export const okrTool = {
  page: {
    seo: {
      title: 'OKR-sjekken — AI-vurdering av dine OKR-er',
      description: 'Lim inn Objective og Key Results og få umiddelbar vurdering med score, styrker og forbedringsforslag. Ingen registrering.',
    },
    toolName: 'OKR-sjekken',
    breadcrumbLabel: 'OKR-sjekken',
    h1: 'Holder OKR-ene dine faktisk mål?',
    subtitle: 'Lim inn OKR-settet ditt og få tilbakemelding på under ett minutt.',
    disclaimer: 'Ment som støtte til refleksjon – ikke fasit.',
    whenToUse: [
      'Når du har skrevet OKR-er, men er usikker på om de er gode nok',
      'Før du presenterer OKR-ene for teamet eller ledelsen',
      'Når du vil ha rask feedback uten å vente på en workshop',
    ],
    benefits: {
      items: [
        'Konkret feedback på hvert Key Result',
        'Vurdering av målbarhet, ambisjonsnivå og kobling til Objective',
        'Forslag til forbedringer du kan bruke direkte',
      ],
      footnote: 'Ment som støtte til refleksjon – ikke fasit.',
    },
    relatedTools: [
      { name: 'Beslutningslogg', href: '/beslutningslogg', description: 'Dokumenter OKR-beslutningene dere har tatt.' },
      { name: 'Konseptspeilet', href: '/konseptspeilet', description: 'Test og forbedre produktideer før dere setter OKR-er.' },
    ],
    mobileCTA: { buttonText: 'Sjekk OKR-settet', disabled: false, showArrow: true },
  },
  ui: {
    infoBox: [
      'Lim inn <strong>Objective</strong> + <strong>Key Results</strong>',
      'Få vurdering, styrker og forbedringsforslag',
      'Under ett minutt · Ingen lagring',
    ],
    inputLabel: 'Lim inn OKR-settet ditt',
    exampleButton: 'Prøv med eksempel',
    placeholder: `Objective:\nDitt mål her...\n\nKey Results:\n1. Første målbare resultat\n2. Andre målbare resultat\n3. Tredje målbare resultat`,
    submitButton: 'Sjekk OKR-settet ditt',
    loadingButton: 'Vurderer OKR-ene dine...',
    loadingMessage: 'Vurderer OKR-ene dine - dette tar vanligvis 5-10 sekunder...',
    resetButton: 'Start på nytt',
    resultLabel: 'Vurderingsresultat',
    privacy: {
      introText: 'OKR-ene du limer inn brukes kun til å generere vurderingen og lagres ikke. Unngå konfidensiell eller sensitiv informasjon.',
      howItWorks: 'Vurderingen genereres av Claude Sonnet 4.6 fra Anthropic, som analyserer OKR-settet basert på etablerte prinsipper for god målsetting.',
    },
    // OKRPageContent strings
    whenUseful: {
      heading: 'Når er dette nyttig?',
      items: [
        'Foran en ny OKR-periode, for en rask kvalitetssjekk',
        'Når OKR-ene ligner mer på oppgaver enn mål',
        'Som utgangspunkt for diskusjon i teamet',
      ],
      humanCTA: 'Vil du ha et menneskelig blikk i tillegg?',
      footnote: 'OKR-sjekken er laget av FYRK.',
    },
    // Context section strings
    contextToggle: 'Legg til kontekst (valgfritt)',
    industryLabel: 'Bransje',
    teamTypeLabel: 'Teamtype',
    maturityLabel: 'OKR-modenhet',
    // OKRResultDisplay strings
    result: {
      assessmentInProgress: 'Vurdering pågår...',
      assessmentComplete: 'Vurdering fullført',
      overallAssessment: 'Samlet vurdering',
      readMore: 'Les mer',
      readLess: 'Vis mindre',
      strengthsTitle: 'Hva fungerer bra',
      improvementsTitle: 'Hva kan forbedres',
      suggestionTitle: 'Forslag til forbedret OKR-sett',
      copyButton: 'Kopier',
      copiedButton: 'Kopiert!',
      feedbackQuestion: 'Var dette nyttig?',
      feedbackYes: 'Ja',
      feedbackNo: 'Nei',
      feedbackThanks: 'Takk for tilbakemeldingen!',
      reEvaluateButton: 'Evaluer forslaget',
    },
  },
  example: `Objective:\nGjøre det enkelt og trygt for brukere å komme i gang med produktet.\n\nKey Results:\n1. Øke aktiveringsraten (fullført onboarding) fra 45 % til 70 %.\n2. Redusere tid til første verdi fra 10 minutter til under 3 minutter.\n3. Redusere onboarding-relaterte supporthenvendelser med 50 %.`,
} as const;
