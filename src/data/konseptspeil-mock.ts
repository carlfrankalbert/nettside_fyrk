/**
 * Mock response data for local testing of Konseptspeilet v2 JSON format
 *
 * This mock data is used when KONSEPTSPEILET_MOCK=true is set in the environment.
 * It provides realistic examples that match the v2 JSON format.
 *
 * To use: Set KONSEPTSPEILET_MOCK=true in your .env file or environment
 */

import type { KonseptspeilJsonResponse } from '../types/konseptspeil-v2';

/**
 * Mock response for a concept about a product management tool
 */
export const MOCK_RESPONSE_PRODUCT_TOOL: KonseptspeilJsonResponse = {
  refleksjon_status: {
    kommentar: "Du har beskrevet løsningen detaljert, men problemet den løser er kun antydet.",
    antagelser_funnet: 4
  },
  fokus_sporsmal: {
    overskrift: "HVIS DU VIL UTFORSKE ÉN TING VIDERE",
    sporsmal: "Hvordan håndterer produktledere dette problemet i dag, og hva gjør det vanskelig?",
    hvorfor: "Problemet er nevnt, men ikke konkretisert med eksempler eller observasjoner."
  },
  dimensjoner: {
    verdi: {
      status: "antatt",
      observasjon: "Målgruppen er nevnt som 'produktledere', men hvilke roller eller kontekster er ikke spesifisert."
    },
    brukbarhet: {
      status: "ikke_nevnt",
      observasjon: "Det er ikke beskrevet hvordan eller når verktøyet vil brukes i praksis."
    },
    gjennomforbarhet: {
      status: "antatt",
      observasjon: "Teksten antyder at logging og tagging er mulig å bygge, uten å nevne konkret teknologi."
    },
    levedyktighet: {
      status: "ikke_nevnt",
      observasjon: "Forretningsmodell eller ressursbehov er ikke nevnt."
    }
  },
  antagelser_liste: [
    "Det antas at produktledere opplever det som utfordrende å holde oversikt over discovery-arbeid.",
    "Teksten legger til grunn at logging av samtaler vil føre til bedre hukommelse av innsikt.",
    "Det antas at produktledere har tid til å tagge og organisere samtaler.",
    "Teksten legger til grunn at mønstre over tid er nyttig informasjon for prioritering."
  ]
};

/**
 * Mock response for an early-stage idea
 */
export const MOCK_RESPONSE_EARLY_IDEA: KonseptspeilJsonResponse = {
  refleksjon_status: {
    kommentar: "Ideen er på et tidlig stadium der mye er antatt og lite er konkretisert.",
    antagelser_funnet: 3
  },
  fokus_sporsmal: {
    overskrift: "HVIS DU VIL UTFORSKE ÉN TING VIDERE",
    sporsmal: "Hvem er det egentlig som opplever dette problemet, og hvor viktig er det for dem?",
    hvorfor: "Målgruppen og problemets alvorlighetsgrad er ikke beskrevet konkret."
  },
  dimensjoner: {
    verdi: {
      status: "antatt",
      observasjon: "Det antas at dette er et problem, men målgruppen er uklar."
    },
    brukbarhet: {
      status: "ikke_nevnt",
      observasjon: "Ingen beskrivelse av hvordan løsningen vil fungere i praksis."
    },
    gjennomforbarhet: {
      status: "ikke_nevnt",
      observasjon: "Teknisk gjennomførbarhet er ikke vurdert."
    },
    levedyktighet: {
      status: "ikke_nevnt",
      observasjon: "Ingen tanker om virksomhetsmodell eller bærekraft."
    }
  },
  antagelser_liste: [
    "Det antas at det finnes mennesker som opplever dette som et problem.",
    "Teksten legger til grunn at en løsning på dette vil være verdifull for noen.",
    "Det antas at problemet er stort nok til at folk vil endre adferd."
  ]
};

/**
 * Mock response for a more defined concept
 */
export const MOCK_RESPONSE_DEFINED_CONCEPT: KonseptspeilJsonResponse = {
  refleksjon_status: {
    kommentar: "Konseptet har flere konkrete elementer, men noen sentrale antagelser er ikke validert.",
    antagelser_funnet: 4
  },
  fokus_sporsmal: {
    overskrift: "HVIS DU VIL UTFORSKE ÉN TING VIDERE",
    sporsmal: "Hvor mye tid bruker småbedriftseiere faktisk på fakturering i dag?",
    hvorfor: "Tidsbesparelse er hovedverdien, men den faktiske tidsbruken er ikke dokumentert."
  },
  dimensjoner: {
    verdi: {
      status: "beskrevet",
      observasjon: "Tidsbesparelse for småbedriftseiere er tydelig beskrevet som hovedverdi."
    },
    brukbarhet: {
      status: "antatt",
      observasjon: "Mobilapp-format er nevnt, men brukeropplevelsen er ikke utforsket."
    },
    gjennomforbarhet: {
      status: "antatt",
      observasjon: "Ett-klikks-fakturering høres enkelt ut, men tekniske detaljer mangler."
    },
    levedyktighet: {
      status: "ikke_nevnt",
      observasjon: "Prising eller konkurransesituasjon er ikke omtalt."
    }
  },
  antagelser_liste: [
    "Det antas at småbedriftseiere opplever fakturering som tidkrevende.",
    "Teksten legger til grunn at en mobilapp er riktig format for denne oppgaven.",
    "Det antas at ett-klikks-fakturering er mulig å bygge.",
    "Teksten legger til grunn at tidsbesparelse er det viktigste for denne målgruppen."
  ]
};

/**
 * Get mock response based on input content
 */
export function getMockResponse(input: string): KonseptspeilJsonResponse {
  const lowerInput = input.toLowerCase();

  // Keywords that suggest a product management tool concept
  if (
    lowerInput.includes('produktled') ||
    lowerInput.includes('discovery') ||
    lowerInput.includes('samtaler') ||
    lowerInput.includes('brukersamtaler')
  ) {
    return MOCK_RESPONSE_PRODUCT_TOOL;
  }

  // Keywords that suggest a more defined concept
  if (
    lowerInput.includes('løsning') ||
    lowerInput.includes('app') ||
    lowerInput.includes('funksjon') ||
    lowerInput.includes('feature') ||
    lowerInput.includes('målgruppe')
  ) {
    return MOCK_RESPONSE_DEFINED_CONCEPT;
  }

  // Default to early idea response
  return MOCK_RESPONSE_EARLY_IDEA;
}

/**
 * Get the mock response as JSON string (as returned by the API)
 */
export function getMockResponseJson(input: string): string {
  return JSON.stringify(getMockResponse(input), null, 2);
}
