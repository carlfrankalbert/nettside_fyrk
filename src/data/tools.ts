/**
 * Tool page content
 * Single source of truth for all tool pages and React components
 *
 * Each tool exports:
 * - page: Astro page content (SEO, hero, sidebar)
 * - ui: React component UI strings (labels, placeholders, buttons, loading messages)
 * - example: Example text constant (where applicable)
 */

// ============================================================================
// OKR-sjekken
// ============================================================================

export const okrTool = {
  page: {
    seo: {
      title: 'OKR-sjekken | FYRK',
      description: 'Lim inn OKR-settet ditt og få tilbakemelding på under ett minutt. Ment som støtte til refleksjon.',
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
      introText: 'OKR-ene du legger inn brukes kun til å generere vurderingen. Unngå å lime inn konfidensiell eller sensitiv informasjon.',
      howItWorks: 'Vurderingen genereres av Claude (Anthropic), en AI-modell som analyserer OKR-settet ditt basert på etablerte prinsipper for god målsetting.',
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
      footnote: 'OKR-sjekken er laget av FYRK som supplement til rådgivning.',
    },
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
    },
  },
  example: `Objective:\nGjøre det enkelt og trygt for brukere å komme i gang med produktet.\n\nKey Results:\n1. Øke aktiveringsraten (fullført onboarding) fra 45 % til 70 %.\n2. Redusere tid til første verdi fra 10 minutter til under 3 minutter.\n3. Redusere onboarding-relaterte supporthenvendelser med 50 %.`,
} as const;

// ============================================================================
// Konseptspeilet
// ============================================================================

export const konseptspeilTool = {
  page: {
    seo: {
      title: 'Test og forbedre produktidéer – avdekk antakelser tidlig',
      description: 'Gratis verktøy for å teste og forbedre produktidéer. Avdekker skjulte antakelser og hull i tidlige konsepter – på 1 min, uten registrering.',
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
    relatedTools: [
      { name: 'Antakelseskartet', href: '/antakelseskart', description: 'Avdekk de skjulte antakelsene i konseptet ditt.' },
      { name: 'Beslutningslogg', href: '/beslutningslogg', description: 'Dokumenter beslutningene du tar etter refleksjonen.' },
    ],
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
      howItWorks: 'Refleksjonen genereres av Claude (Anthropic), strukturert rundt de fire produktrisikoene (verdi, brukbarhet, gjennomførbarhet, levedyktighet).',
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

// ============================================================================
// Antakelseskartet
// ============================================================================

export const antakelseskartTool = {
  page: {
    seo: {
      title: 'Avdekk skjulte antakelser i produktbeslutninger',
      description: 'Gratis verktøy som gjør implisitte antakelser eksplisitte. Identifiser risiko og blindsoner i produkt- og strategibeslutninger.',
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
      howItWorks: 'Antakelsene genereres av Claude (Anthropic). Verktøyet analyserer teksten og identifiserer implisitte forutsetninger.',
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

// ============================================================================
// Beslutningslogg
// ============================================================================

export const beslutningsloggTool = {
  page: {
    seo: {
      title: 'Beslutningslogg – dokumenter beslutninger med klarhet',
      description: 'Gratis verktøy for å dokumentere beslutninger på en strukturert måte. Eksporter til Markdown for Notion, Confluence eller GitHub.',
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

// ============================================================================
// Pre-Mortem Brief
// ============================================================================

export const preMortemTool = {
  page: {
    seo: {
      title: 'Pre-Mortem Brief - Tenk gjennom hva som kan gå galt',
      description: 'Gratis verktøy som hjelper deg å identifisere failure modes, tidlige indikatorer og stopp-kriterier før du tar irreversible beslutninger.',
    },
    toolName: 'Pre-Mortem Brief',
    breadcrumbLabel: 'Pre-Mortem Brief',
    h1: 'Hva kan gå galt?',
    badge: 'Beta',
    subtitle: 'Beskriv en beslutning du vurderer. AI-en hjelper deg å tenke gjennom failure modes, tidlige varselsignaler og kriterier for når du bør stoppe - før det er for sent.',
    tagline: 'Ingen registrering · Ingen lagring · Bare klarhet',
    whenToUse: [
      'Før du forplikter deg til en større beslutning som er vanskelig å reversere',
      'Når teamet er enige, men ingen har spurt "hva om vi tar feil?"',
      'I styremøter og ledergrupper for å dokumentere risikovurdering',
      'Når du vil ha konkrete kriterier for når du bør evaluere eller avbryte',
    ],
    benefits: {
      items: [
        '5-6 konkrete failure modes med konsekvenskategori',
        'Tidlige varselsignaler du kan overvåke',
        'Stopp-kriterier for PAUSE og FULL TILBAKETREKKING',
        'Forslag til eierskap og ansvar',
      ],
      footnote: 'Ingen anbefaling om hva du bør gjøre. Bare strukturert risikotenkning.',
    },
    relatedTools: [
      { name: 'Antakelseskartet', href: '/antakelseskart', description: 'Avdekk de implisitte antakelsene bak beslutningen.' },
      { name: 'Beslutningslogg', href: '/beslutningslogg', description: 'Dokumenter risikobeslutningene du har tatt.' },
    ],
    mobileCTA: { buttonText: 'Generer Pre-Mortem Brief' },
  },
  ui: {
    piiWarning: 'Unngå personopplysninger og hemmelige detaljer i skjemaet.',
    beslutningLabel: 'Beslutning',
    beslutningHelp: 'Beskriv beslutningen som skal tas',
    beslutningPlaceholder: 'F.eks: Vi vurderer å bytte fra on-premise til cloud-basert infrastruktur for alle kundedatabaser...',
    bransjeLabel: 'Bransje / Domene',
    kundetypeLabel: 'Kundetype',
    kontekstLabel: 'Kort kontekst',
    kontekstHelp: 'Bakgrunn og relevante omstendigheter',
    kontekstPlaceholder: 'F.eks: Vi har 50 000 aktive kunder og behandler ca. 2 millioner transaksjoner daglig. Dagens løsning er 8 år gammel...',
    risikoLabel: 'Regulatorisk / Risikonivå',
    risikoForklaringLabel: 'Forklaring (valgfritt)',
    risikoForklaringHelp: 'Utdyp risikonivået',
    risikoForklaringPlaceholder: 'F.eks: GDPR, PCI-DSS krav...',
    beslutningsfristLabel: 'Beslutningsfrist',
    beslutningsfristHelp: 'Når må beslutningen tas?',
    beslutningsfristPlaceholder: 'F.eks: Innen Q2 2024, 15. mars...',
    effekthorisontLabel: 'Effekthorisont',
    effekthorisontHelp: 'Når forventes effekten?',
    effekthorisontPlaceholder: 'F.eks: 6-24 måneder, 2-3 år...',
    optionalFieldsToggle: 'Valgfrie felt (klikk for å utvide)',
    tidligereForsokLabel: 'Tidligere forsøk eller relevant erfaring',
    tidligereForsokPlaceholder: 'Har lignende beslutninger vært tatt før? Hva skjedde?',
    interessenterLabel: 'Nøkkelinteressenter',
    interessenterPlaceholder: 'Hvem påvirkes av beslutningen? Hvem har innflytelse?',
    konfidensialitetLabel: 'Konfidensialitetsnivå',
    konfidensialitetHelp: 'Påvirker detaljnivå i output',
    submitButton: 'Generer Pre-Mortem Brief',
    loadingButton: 'Genererer brief...',
    resetButton: 'Start på nytt',
    resultLabel: 'Pre-Mortem Brief resultat',
    privacy: {
      introText: 'Informasjonen du legger inn brukes kun til å generere Pre-Mortem Brief. Unngå å legge inn konfidensiell eller sensitiv informasjon.',
      howItWorks: 'Briefen genereres av Claude (Anthropic), en AI-modell som analyserer beslutningsinformasjonen basert på etablerte risikoanalyseprinsipper.',
    },
  },
  selectOptions: {
    bransje: [
      { value: '', label: 'Velg bransje...' },
      { value: 'bank_finans', label: 'Bank / Finans' },
      { value: 'offentlig', label: 'Offentlig sektor' },
      { value: 'energi', label: 'Energi' },
      { value: 'b2b_saas', label: 'B2B SaaS' },
      { value: 'annet', label: 'Annet' },
    ],
    risikoniva: [
      { value: '', label: 'Velg nivå...' },
      { value: 'lav', label: 'Lav' },
      { value: 'medium', label: 'Medium' },
      { value: 'hoy', label: 'Høy' },
    ],
    kundetype: [
      { value: '', label: 'Velg kundetype...' },
      { value: 'b2c', label: 'B2C' },
      { value: 'b2b', label: 'B2B' },
      { value: 'offentlig', label: 'Offentlig' },
    ],
    konfidensialitet: [
      { value: 'intern', label: 'Intern (normal detalj)' },
      { value: 'begrenset', label: 'Begrenset (moderat detalj)' },
      { value: 'styresensitiv', label: 'Styresensitiv (abstrakt)' },
    ],
  },
} as const;
