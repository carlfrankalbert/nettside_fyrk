/**
 * Antakelseskartet tool page content
 */

export const antakelseskartTool = {
  page: {
    seo: {
      title: 'Avdekk skjulte antakelser i produktbeslutninger',
      description: 'Gjør implisitte antakelser eksplisitte. Identifiser risiko og blindsoner i produkt- og strategibeslutninger. Ingen registrering.',
    },
    toolName: 'Antakelseskartet',
    breadcrumbLabel: 'Antakelseskartet',
    h1: 'Finn antakelsene du ikke visste du hadde',
    badge: 'Beta',
    subtitle: 'Beskriv en beslutning. AI-en avdekker de implisitte antakelsene som ligger til grunn - og hjelper deg å prioritere hva du bør teste.',
    tagline: 'Ingen registrering · Ingen scoring · Bare klarhet',
    whenToUse: [
      'Før du forplikter deg til en større produkt- eller strategibeslutning',
      'Når teamet diskuterer, men snakker forbi hverandre',
      'I strategimøter for å synliggjøre hva som tas for gitt',
      'Når du vil finne ut hva som faktisk bør testes',
    ],
    benefits: {
      items: [
        '8-15 implisitte antakelser gruppert i fire kategorier',
        'Mulighet til å vurdere sikkerhet og konsekvens for hver antakelse',
        'Automatisk markering av kritiske antakelser (lav sikkerhet + høy konsekvens)',
      ],
      footnote: 'Ingen råd. Ingen fasit. Bare synliggjøring av det som er tatt for gitt.',
    },
    relatedTools: [
      { name: 'Pre-Mortem Brief', href: '/verktoy/pre-mortem', description: 'Hva om antakelsene dine er feil? Tenk gjennom hva som kan gå galt.' },
      { name: 'Konseptspeilet', href: '/konseptspeilet', description: 'Test og forbedre produktideen bak beslutningen.' },
    ],
    mobileCTA: { buttonText: 'Avdekk antakelser' },
  },
  ui: {
    exampleLabel: 'Eksempel:',
    exampleQuote: '"Vi vurderer å lansere en abonnementsbasert tjeneste for produktteam som vil ha raskere tilgang til brukerinnsikt..."',
    exampleExplainer: 'Verktøyet vil typisk avdekke 8-15 implisitte antakelser om målgruppe, behov, løsning og forretningsmodell.',
    exampleButton: 'Prøv dette eksempelet',
    inputLabel: 'Beskriv beslutningen',
    placeholder: 'Vi vurderer å... Tanken er at... Vi tror at...',
    minimumHelper: 'Skriv litt mer for å avdekke antakelser.',
    submitButton: 'Avdekk antakelser',
    loadingButton: 'Avdekker antakelser...',
    resultLabel: 'Antakelser',
    privacy: {
      introText: 'Teksten du skriver brukes kun til å identifisere antakelser. Unngå å lime inn konfidensiell eller sensitiv informasjon.',
      howItWorks: 'Antakelsene genereres av Claude Sonnet 4.6 fra Anthropic. Verktøyet analyserer teksten og identifiserer implisitte forutsetninger.',
    },
    // AntakelseskartResultDisplay strings
    result: {
      decisionLabel: 'Din beslutning',
      assumptionsCount: 'antakelser identifisert',
      implicitDisclaimer: 'Dette er antakelser som ligger implisitt i teksten. Marker sikkerhet og konsekvens for å finne de kritiske.',
      assessLabel: 'Vurder antakelsene',
      assessDescription: 'Marker sikkerhet og konsekvens for hver antakelse',
      showAssessment: 'Start vurdering',
      hideAssessment: 'Skjul vurdering',
      editButton: 'Rediger',
      copyButton: 'Kopier',
      resetButton: 'Start på nytt',
      streaming: 'Identifiserer antakelser...',
      incomplete: 'Responsen ser ut til å være ufullstendig',
      incompleteBody: 'AI-en returnerte ikke det forventede formatet. Dette kan skyldes et midlertidig problem.',
      retryButton: 'Prøv igjen',
    },
    loaderMessages: [
      'Leser gjennom beskrivelsen …',
      'Identifiserer implisitte antakelser …',
      'Grupperer etter kategori …',
      'Ferdigstiller …',
    ] as const,
  },
  example: `Vi vurderer å lansere en abonnementsbasert tjeneste for produktteam som vil ha raskere tilgang til brukerinnsikt.

Tanken er at produktledere i mellomstore selskaper sliter med å få nok tid til å snakke med brukere, og at en AI-drevet løsning kan analysere eksisterende kundedata og generere innsikt automatisk.

Vi tror dette kan redusere tiden fra "idé til validert innsikt" betydelig, og at teamene vil betale for å spare tid. Planen er å starte med en gratisversjon for å bygge brukermasse, og deretter konvertere til betalende kunder.`,
} as const;
