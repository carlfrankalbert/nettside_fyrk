/**
 * Mock response data for local testing of Konseptspeilet v2
 *
 * This mock data is used when KONSEPTSPEILET_MOCK=true is set in the environment.
 * It provides realistic examples that match the v2 structured format.
 *
 * To use: Set KONSEPTSPEILET_MOCK=true in your .env file or environment
 */

/**
 * Mock response for a concept about a product management tool
 */
export const MOCK_RESPONSE_PRODUCT_TOOL = `---SUMMARY---
assumptions: 4
unclear: 3
maturity: 2
recommendation: Utforsk brukerbehov før du går videre
---END_SUMMARY---

---DIMENSIONS---
value: assumed
value_desc: Problemet er nevnt, men ikke validert med brukere.
usability: not_addressed
usability_desc: Hvordan produktledere vil bruke verktøyet er ikke beskrevet.
feasibility: assumed
feasibility_desc: Teksten antyder at logging og tagging er mulig å bygge.
viability: not_addressed
viability_desc: Forretningsmodell eller ressursbehov er ikke nevnt.
---END_DIMENSIONS---

---ASSUMPTIONS---
- Teksten antyder at produktledere opplever det som utfordrende å holde oversikt over discovery-arbeid
- Det kan ligge en antakelse om at logging av samtaler vil føre til bedre hukommelse av innsikt
- Det virker som teksten forutsetter at produktledere i mellomstore tech-selskaper har tid til å tagge og organisere samtaler
- Teksten antyder at mønstre over tid er nyttig informasjon for prioritering
---END_ASSUMPTIONS---

---QUESTIONS---
- Hvordan håndterer produktledere dette i dag, og hva er det som gjør det vanskelig?
- Hva skal til for at en produktleder faktisk logger samtaler konsekvent over tid?
- Hvilke mønstre er det interessant å se, og hvordan vil de informere prioritering?
- Er tidsbruk på logging verdt innsikten man får tilbake?
- Hva ville skje hvis du lot dette problemet ligge?
---END_QUESTIONS---`;

/**
 * Mock response for an early-stage idea
 */
export const MOCK_RESPONSE_EARLY_IDEA = `---SUMMARY---
assumptions: 3
unclear: 4
maturity: 1
recommendation: Snakk med noen som har dette problemet
---END_SUMMARY---

---DIMENSIONS---
value: assumed
value_desc: Det antas at dette er et problem, men målgruppen er uklar.
usability: not_addressed
usability_desc: Ingen beskrivelse av hvordan løsningen vil fungere.
feasibility: not_addressed
feasibility_desc: Teknisk gjennomførbarhet er ikke vurdert.
viability: not_addressed
viability_desc: Ingen tanker om virksomhetsmodell.
---END_DIMENSIONS---

---ASSUMPTIONS---
- Det kan ligge en antakelse om at det finnes mennesker som opplever dette som et problem
- Teksten antyder at en løsning på dette vil være verdifull for noen
- Det virker som teksten forutsetter at problemet er stort nok til at folk vil endre adferd
---END_ASSUMPTIONS---

---QUESTIONS---
- Hvem er det egentlig som opplever dette?
- Hva gjør de i dag for å håndtere det?
- Hvor viktig er dette sammenlignet med andre utfordringer de har?
- Hva ville få dem til å prøve noe nytt?
- Hva ville skje hvis du ikke løste dette problemet?
---END_QUESTIONS---`;

/**
 * Mock response for a more defined concept
 */
export const MOCK_RESPONSE_DEFINED_CONCEPT = `---SUMMARY---
assumptions: 4
unclear: 2
maturity: 3
recommendation: Test antagelsen om ett-klikks-fakturering med prototyp
---END_SUMMARY---

---DIMENSIONS---
value: described
value_desc: Tidsbesparelse for småbedriftseiere er tydelig beskrevet som hovedverdi.
usability: assumed
usability_desc: Mobilapp-format er nevnt, men brukeropplevelsen er ikke utforsket.
feasibility: assumed
feasibility_desc: Ett-klikks-fakturering høres enkelt ut, men tekniske detaljer mangler.
viability: not_addressed
viability_desc: Prising eller konkurransesituasjon er ikke omtalt.
---END_DIMENSIONS---

---ASSUMPTIONS---
- Teksten antyder at småbedriftseiere opplever fakturering som tidkrevende
- Det kan ligge en antakelse om at en mobilapp er riktig format for denne oppgaven
- Det virker som teksten forutsetter at ett-klikks-fakturering er mulig å bygge
- Teksten antyder at tidsbesparelse er det viktigste for denne målgruppen
---END_ASSUMPTIONS---

---QUESTIONS---
- Hvor mye tid bruker småbedriftseiere faktisk på fakturering i dag?
- Hva bruker de nå, og hva er det som gjør det tidkrevende?
- Er mobil det foretrukne formatet for denne typen oppgaver?
- Hva skal til for at de vil bytte fra noe de allerede bruker?
- Hva ville være godt nok – og hva ville være for lite?
---END_QUESTIONS---`;

/**
 * Get mock response based on input content
 */
export function getMockResponse(input: string): string {
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
 * Get the mock response as returned by the API
 * (Now returns Markdown string directly, not JSON)
 */
export function getMockResponseJson(input: string): string {
  return getMockResponse(input);
}
