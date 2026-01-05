/**
 * Mock response data for local testing of Konseptspeilet
 *
 * This mock data is used when KONSEPTSPEILET_MOCK=true is set in the environment.
 * It provides a realistic example that exercises all UI elements:
 * - All four observation dimensions
 * - Governance patterns (styringsmønstre)
 * - All reflection fields
 * - Meta information
 *
 * To use: Set KONSEPTSPEILET_MOCK=true in your .env file or environment
 */

export interface KonseptspeilMockResponse {
  fase: {
    status: 'utforskning' | 'forming' | 'forpliktelse';
    begrunnelse: string;
    fokusområde: string;
  };
  observasjoner: {
    bruker: {
      tilstede: string | null;
      uutforsket: string | null;
      modenhet: 'antakelse' | 'hypotese' | 'tidlig-signal' | 'validert';
    } | null;
    brukbarhet: {
      tilstede: string | null;
      uutforsket: string | null;
      modenhet: 'antakelse' | 'hypotese' | 'tidlig-signal' | 'validert';
    } | null;
    gjennomførbarhet: {
      tilstede: string | null;
      uutforsket: string | null;
      modenhet: 'antakelse' | 'hypotese' | 'tidlig-signal' | 'validert';
    } | null;
    levedyktighet: {
      tilstede: string | null;
      uutforsket: string | null;
      modenhet: 'antakelse' | 'hypotese' | 'tidlig-signal' | 'validert';
    } | null;
  };
  styringsmønstre: {
    observerte: Array<{
      mønster: string;
      signal: string;
    }>;
    kommentar: string | null;
  } | null;
  refleksjon: {
    kjernespørsmål: string;
    hypoteser_å_teste: string[] | null;
    neste_læring: string | null;
  };
  meta: {
    dekningsgrad: 'tynn' | 'delvis' | 'fyldig';
    usikkerheter: string[] | null;
  };
}

/**
 * A comprehensive mock response that exercises all UI elements.
 * Based on a "forming" phase concept to show governance patterns.
 */
export const MOCK_RESPONSE_FORMING: KonseptspeilMockResponse = {
  fase: {
    status: 'forming',
    begrunnelse:
      'Konseptet har identifisert en brukergruppe og en løsningsretning, men antagelsene om brukerens behov og løsningens effekt er ikke testet. Dette plasserer konseptet i forming-fasen der aktiv læring er sentralt.',
    fokusområde:
      'Å validere om de identifiserte brukerne faktisk opplever smerten som er antatt, og om den foreslåtte løsningen vil adressere den.',
  },
  observasjoner: {
    bruker: {
      tilstede:
        'Teksten nevner "småbedriftseiere som sliter med tidkrevende fakturering" som målgruppe.',
      uutforsket:
        'Det er ikke beskrevet hvordan disse brukerne håndterer fakturering i dag, eller hvor stor smerten faktisk er.',
      modenhet: 'antakelse',
    },
    brukbarhet: {
      tilstede:
        'En mobilapp med "ett-klikks fakturering" er nevnt som løsning.',
      uutforsket:
        'Hvordan brukeren vil oppdage, lære og ta i bruk løsningen er ikke adressert.',
      modenhet: 'antakelse',
    },
    gjennomførbarhet: {
      tilstede:
        'Teksten nevner integrasjon med eksisterende regnskapssystemer som en forutsetning.',
      uutforsket:
        'Hvilke spesifikke systemer, og kompleksiteten i slike integrasjoner, er ikke utforsket.',
      modenhet: 'hypotese',
    },
    levedyktighet: {
      tilstede:
        'En freemium-modell med premium-funksjoner er skissert som forretningsmodell.',
      uutforsket:
        'Betalingsvillighet og konkurransesituasjonen er ikke omtalt.',
      modenhet: 'antakelse',
    },
  },
  styringsmønstre: {
    observerte: [
      {
        mønster: 'løsning-før-problem',
        signal:
          'Mobilappen og dens funksjoner er beskrevet i detalj, mens brukerens faktiske problem kun er overfladisk nevnt.',
      },
      {
        mønster: 'suksesskriterier-uten-baseline',
        signal:
          'Målet om "50% reduksjon i tid brukt på fakturering" er nevnt uten referanse til nåværende tidsbruk.',
      },
    ],
    kommentar:
      'Disse mønstrene er vanlige i tidlig produktutvikling og indikerer områder der det kan være verdifullt å stille utdypende spørsmål.',
  },
  refleksjon: {
    kjernespørsmål:
      'Hva ville det bety for konseptet om småbedriftseiere ikke opplever fakturering som en betydelig smerte?',
    hypoteser_å_teste: [
      'Småbedriftseiere bruker mer enn 2 timer per uke på fakturering',
      'Eksisterende løsninger oppleves som utilstrekkelige for denne gruppen',
      'Mobilapp er den foretrukne plattformen for denne oppgaven',
    ],
    neste_læring:
      'Å snakke med 5-10 småbedriftseiere om deres faktiske faktureringspraksis og opplevde utfordringer.',
  },
  meta: {
    dekningsgrad: 'delvis',
    usikkerheter: [
      'Teknisk kompleksitet i integrasjoner',
      'Konkurransesituasjonen i markedet',
      'Faktisk betalingsvillighet',
    ],
  },
};

/**
 * A simpler mock for "utforskning" phase (early exploration).
 * No governance patterns, lighter observations.
 */
export const MOCK_RESPONSE_UTFORSKNING: KonseptspeilMockResponse = {
  fase: {
    status: 'utforskning',
    begrunnelse:
      'Dette er en tidlig idé der tanker og muligheter utforskes. Det finnes ingen forpliktelser eller detaljerte planer ennå.',
    fokusområde:
      'Å bli kjent med problemområdet og de som eventuelt opplever det.',
  },
  observasjoner: {
    bruker: {
      tilstede: 'Det antydes at "noen" sliter med noe, men dette er ikke spesifisert.',
      uutforsket: 'Hvem disse menneskene er og hva de faktisk opplever.',
      modenhet: 'antakelse',
    },
    brukbarhet: null,
    gjennomførbarhet: null,
    levedyktighet: null,
  },
  styringsmønstre: null,
  refleksjon: {
    kjernespørsmål:
      'Hvem er det du ser for deg at dette kunne være verdifullt for?',
    hypoteser_å_teste: null,
    neste_læring:
      'Å observere eller snakke med mennesker som potensielt har dette problemet.',
  },
  meta: {
    dekningsgrad: 'tynn',
    usikkerheter: [
      'Målgruppen er ikke definert',
      'Problemet er ikke konkretisert',
    ],
  },
};

/**
 * A comprehensive mock for "forpliktelse" phase (commitment/execution).
 */
export const MOCK_RESPONSE_FORPLIKTELSE: KonseptspeilMockResponse = {
  fase: {
    status: 'forpliktelse',
    begrunnelse:
      'Konseptet har validert kjerneantagelser og er nær beslutning om iverksetting. Brukerundersøkelser og pilotering er gjennomført.',
    fokusområde:
      'Å sikre at alle avhengigheter og risikoer er forstått før full skalering.',
  },
  observasjoner: {
    bruker: {
      tilstede:
        'Pilotgruppe på 50 brukere har testet løsningen i 3 måneder med god tilbakemelding.',
      uutforsket:
        'Hvordan løsningen vil fungere for brukere utenfor pilotgruppen.',
      modenhet: 'tidlig-signal',
    },
    brukbarhet: {
      tilstede:
        'Brukertester viser 85% oppgaveløsning uten hjelp. Onboarding-flyt er designet og testet.',
      uutforsket: 'Langsiktig engasjement og retensjon.',
      modenhet: 'tidlig-signal',
    },
    gjennomførbarhet: {
      tilstede:
        'Teknisk arkitektur er validert. Integrasjoner med de tre største regnskapssystemene er testet.',
      uutforsket:
        'Skaleringsutfordringer ved høyere volum.',
      modenhet: 'validert',
    },
    levedyktighet: {
      tilstede:
        'Betalingsvillighet er testet i pilot. Unit economics viser positiv margin.',
      uutforsket: 'Langsiktig kundelivstidsverdi og churn-rate.',
      modenhet: 'hypotese',
    },
  },
  styringsmønstre: null,
  refleksjon: {
    kjernespørsmål:
      'Hvilke signaler ville fortelle dere at det er riktig tidspunkt å skalere?',
    hypoteser_å_teste: [
      'Retensjon etter 6 måneder er over 60%',
      'Infrastrukturen håndterer 10x dagens volum',
    ],
    neste_læring:
      'Å definere tydelige go/no-go kriterier for neste fase.',
  },
  meta: {
    dekningsgrad: 'fyldig',
    usikkerheter: ['Langsiktig retensjon', 'Skaleringskapasitet'],
  },
};

/**
 * Get mock response based on input content.
 * Attempts to match phase based on keywords in the input.
 */
export function getMockResponse(input: string): KonseptspeilMockResponse {
  const lowerInput = input.toLowerCase();

  // Keywords that suggest "forpliktelse" phase
  if (
    lowerInput.includes('pilot') ||
    lowerInput.includes('validert') ||
    lowerInput.includes('lansering') ||
    lowerInput.includes('skalering')
  ) {
    return MOCK_RESPONSE_FORPLIKTELSE;
  }

  // Keywords that suggest "forming" phase
  if (
    lowerInput.includes('løsning') ||
    lowerInput.includes('app') ||
    lowerInput.includes('funksjon') ||
    lowerInput.includes('feature') ||
    lowerInput.includes('bruker') ||
    lowerInput.includes('målgruppe')
  ) {
    return MOCK_RESPONSE_FORMING;
  }

  // Default to "utforskning" for simple/early ideas
  return MOCK_RESPONSE_UTFORSKNING;
}

/**
 * Get the mock response as a JSON string (as the API would return it)
 */
export function getMockResponseJson(input: string): string {
  return JSON.stringify(getMockResponse(input));
}
