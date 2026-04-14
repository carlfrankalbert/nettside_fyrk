/**
 * Konseptspeilet tool page content
 */

export const konseptspeilTool = {
  page: {
    seo: {
      title: 'Avdekk skjulte antakelser i produktidéer',
      description: 'Test og forbedre produktidéer. Avdekker antakelser og hull i tidlige konsepter — på 1 minutt, uten registrering.',
    },
    toolName: 'Konseptspeilet',
    breadcrumbLabel: 'Konseptspeilet',
    h1: 'Forstå ideen din bedre – før noen andre gjør det',
    subtitle: 'Skriv inn ideen din. AI-en analyserer teksten og avslører blindsoner, manglende logikk og skjulte antakelser på sekunder.',
    tagline: 'Ingen registrering · Ingen salg · Faktisk nyttig',
    whenToUse: [
      'Når du har en produktidé, men er usikker på om den holder',
      'Før du pitcher en idé internt eller eksternt',
      'Når du vil få feedback uten møter eller bias',
    ],
    benefits: {
      items: [
        'Feedback på hva som er antatt vs eksplisitt formulert',
        'Avdekking av hull: målgruppe, verdi, effekt',
        'Et bedre beslutningsgrunnlag før videre arbeid',
      ],
      footnote: 'Ingen scoring. Ingen fasit. Bare et ærlig speil.',
    },
    relatedTools: [],
    mobileCTA: { buttonText: 'Start speiling' },
  },
  ui: {
    exampleIntro: 'Slik ser en speiling ut:',
    exampleQuote: '"Vi vurderer å bygge et enkelt refleksjonsverktøy for produktteam. Tanken er at det skal brukes tidlig i en beslutningsprosess..."',
    exampleExplainer: 'Speilet vil typisk:',
    exampleBullets: [
      '– stille spørsmål ved problemet',
      '– peke på antagelser',
      '– vise hva som ikke er konkretisert',
    ],
    exampleShortButton: 'Prøv dette eksempelet →',
    previewHeading: 'Dette får du:',
    previewItems: [
      'En speiling av ideen fra 4 perspektiver',
      'Antagelser teksten din tar for gitt',
      '1–2 områder som er mest uklare',
    ],
    inputLabel: 'Beskriv konseptet ditt',
    exampleButton: 'Lengre eksempel',
    encouragement: 'Skriv kort og uferdig. Dette speiler hull og antagelser – ikke kvaliteten på ideen.',
    placeholder: 'F.eks: Vi tror at... Problemet er... Målgruppen er...',
    minimumHelper: 'Skriv litt mer for å få en refleksjon.',
    submitButton: 'Start speiling – det tar 1 min',
    loadingButton: 'Speiler tankene dine…',
    resultLabel: 'Refleksjonsresultat',
    privacy: {
      introText: 'Teksten du skriver brukes kun til å generere refleksjonen. Unngå å lime inn konfidensiell eller sensitiv informasjon.',
      howItWorks: 'Refleksjonen genereres av Claude Sonnet 4.6 fra Anthropic, strukturert rundt de fire produktrisikoene (verdi, brukbarhet, gjennomførbarhet, levedyktighet).',
    },
    // KonseptSpeilResultDisplayV2 strings
    result: {
      mirrorDisclaimer: 'Dette speiler antagelser og hull i beskrivelsen – ikke kvaliteten på ideen.',
      nextStepHeading: 'Et mulig neste steg',
      resetButton: 'Start på nytt',
      editButton: 'Rediger',
      copyButton: 'Kopier',
      humanCTA: 'Vil du snakke med et menneske? 20 min sparring.',
      backLink: '← Tilbake til FYRK',
      streaming: 'Analyserer...',
      incomplete: 'Responsen ser ut til å være ufullstendig',
      incompleteBody: 'AI-en returnerte ikke det forventede formatet. Dette kan skyldes et midlertidig problem.',
      retryButton: 'Prøv igjen',
    },
    loaderMessages: [
      'Leser gjennom teksten …',
      'Kartlegger dimensjonene …',
      'Identifiserer antagelser …',
      'Formulerer speilbilde …',
    ] as const,
  },
  example: `Vi vurderer å teste et enkelt, avgrenset refleksjonsverktøy for produktteam som ofte opplever at beslutninger tas på magefølelse eller basert på ufullstendig informasjon.

Tanken er at verktøyet brukes tidlig i en beslutningsprosess, før man har låst seg til en løsning. Brukeren beskriver kort hva som vurderes, hvorfor det er viktig nå, og hva som oppleves uklart. Verktøyet returnerer et strukturert speil som tydeliggjør hva som er eksplisitt sagt, hvilke antakelser som ligger implisitt i teksten, og hvilke spørsmål som ikke er besvart.

Vi antar at produktledere og team vil ha nytte av å stoppe opp og tenke mer strukturert før større prioriteringer eller investeringer. Målgruppen er erfarne produktledere i kunnskapsorganisasjoner som allerede jobber smidig, men som mangler et enkelt verktøy for å gjøre antakelser synlige.

I første omgang er dette ment som et frivillig pilotverktøy for egen bruk og et lite nettverk, uten ambisjon om kommersialisering. Bruk vil være anonymt, uten innlogging eller lagring. Videre utvikling vurderes basert på faktisk bruk og tilbakemeldinger fra pilotdeltakere.`,
  shortExample: `Vi vurderer å bygge et enkelt refleksjonsverktøy for produktteam.
Tanken er at det skal brukes tidlig i en beslutningsprosess for å avdekke uklarheter før man forplikter seg.
Målgruppen er erfarne produktledere, men vi er usikre på om dette løser et reelt problem eller bare føles nyttig.
Hvis dette ikke gir tydelig verdi, bør vi sannsynligvis ikke bygge det videre.`,
} as const;
