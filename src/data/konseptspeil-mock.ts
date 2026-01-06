/**
 * Mock response data for local testing of Konseptspeilet
 *
 * This mock data is used when KONSEPTSPEILET_MOCK=true is set in the environment.
 * It provides realistic examples that match the simplified MVP output format.
 *
 * To use: Set KONSEPTSPEILET_MOCK=true in your .env file or environment
 */

export interface KonseptspeilMockResponse {
  kort_vurdering: string;
  fase: {
    status: 'utforskning' | 'forming' | 'forpliktelse';
    begrunnelse: string;
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
  kjerneantagelse: string;
  neste_steg: string[];
}

/**
 * Mock response for "forming" phase concept
 */
export const MOCK_RESPONSE_FORMING: KonseptspeilMockResponse = {
  kort_vurdering:
    'Dette er en uklar antagelse om at småbedriftseiere vil bytte til en ny faktureringsapp. Hovedusikkerheten er om fakturering faktisk oppleves som en så stor smerte at de vil endre vaner.',
  fase: {
    status: 'forming',
    begrunnelse:
      'Konseptet har en identifisert løsning og målgruppe, men antagelsene om behovet er ikke testet.',
  },
  observasjoner: {
    bruker: {
      tilstede:
        'Teksten nevner "småbedriftseiere som sliter med tidkrevende fakturering" som målgruppe.',
      uutforsket:
        'Hvordan disse brukerne håndterer fakturering i dag, og hvor stor smerten faktisk er.',
      modenhet: 'antakelse',
    },
    brukbarhet: {
      tilstede: 'En mobilapp med "ett-klikks fakturering" er nevnt som løsning.',
      uutforsket: 'Hvordan brukeren vil oppdage, lære og ta i bruk løsningen.',
      modenhet: 'antakelse',
    },
    gjennomførbarhet: null,
    levedyktighet: null,
  },
  kjerneantagelse:
    'Småbedriftseiere opplever fakturering som så tidkrevende at de vil bytte til en ny app for å spare tid.',
  neste_steg: [
    'Snakk med 5-10 småbedriftseiere om deres faktiske faktureringspraksis',
    'Kartlegg hvilke verktøy de bruker i dag og hva som er mest frustrerende',
    'Test om mobilapp er foretrukket format for denne oppgaven',
  ],
};

/**
 * Mock response for "utforskning" phase (early exploration)
 */
export const MOCK_RESPONSE_UTFORSKNING: KonseptspeilMockResponse = {
  kort_vurdering:
    'Dette er en tidlig idé hvor både hvem brukeren er og hva problemet handler om fortsatt er åpent. Den viktigste usikkerheten er om noen faktisk har dette problemet.',
  fase: {
    status: 'utforskning',
    begrunnelse:
      'En tidlig idé der tanker og muligheter utforskes. Ingen konkrete forpliktelser ennå.',
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
  kjerneantagelse:
    'Det finnes mennesker som opplever dette som et problem verdt å løse.',
  neste_steg: [
    'Definer hvem du ser for deg at dette kunne være verdifullt for',
    'Snakk med 3-5 potensielle brukere om deres opplevelse av problemet',
  ],
};

/**
 * Mock response for "forpliktelse" phase (commitment/execution)
 */
export const MOCK_RESPONSE_FORPLIKTELSE: KonseptspeilMockResponse = {
  kort_vurdering:
    'Dette er en tydelig hypotese som har begynt å bli validert gjennom pilotering. Hovedusikkerheten nå er om resultatene vil holde seg ved skalering.',
  fase: {
    status: 'forpliktelse',
    begrunnelse:
      'Kjerneantagelser er validert og konseptet er nær beslutning om full skalering.',
  },
  observasjoner: {
    bruker: {
      tilstede:
        'Pilotgruppe på 50 brukere har testet løsningen i 3 måneder med god tilbakemelding.',
      uutforsket: 'Hvordan løsningen vil fungere for brukere utenfor pilotgruppen.',
      modenhet: 'tidlig-signal',
    },
    brukbarhet: {
      tilstede:
        'Brukertester viser 85% oppgaveløsning uten hjelp. Onboarding-flyt er designet og testet.',
      uutforsket: 'Langsiktig engasjement og retensjon.',
      modenhet: 'tidlig-signal',
    },
    gjennomførbarhet: null,
    levedyktighet: null,
  },
  kjerneantagelse:
    'Pilotresultatene er representative for hvordan løsningen vil fungere i større skala.',
  neste_steg: [
    'Definer tydelige go/no-go kriterier for skalering',
    'Test infrastruktur med 10x dagens volum',
    'Følg opp retensjon etter 6 måneder i pilotgruppen',
  ],
};

/**
 * Get mock response based on input content
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
