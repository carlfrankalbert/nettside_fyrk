/**
 * Mock response data for local testing of Konseptspeilet
 *
 * This mock data is used when KONSEPTSPEILET_MOCK=true is set in the environment.
 * It provides realistic examples that match the simplified MVP Markdown format.
 *
 * To use: Set KONSEPTSPEILET_MOCK=true in your .env file or environment
 */

/**
 * Mock response for a concept about a product management tool
 */
export const MOCK_RESPONSE_PRODUCT_TOOL = `## Antagelser i teksten

- Teksten antyder at produktledere opplever det som utfordrende å holde oversikt over discovery-arbeid
- Det kan ligge en antakelse om at logging av samtaler vil føre til bedre hukommelse av innsikt
- Det virker som teksten forutsetter at produktledere i mellomstore tech-selskaper har tid til å tagge og organisere samtaler
- Teksten antyder at mønstre over tid er nyttig informasjon for prioritering

## Åpne spørsmål teksten reiser

- Hvordan håndterer produktledere dette i dag, og hva er det som gjør det vanskelig?
- Hva skal til for at en produktleder faktisk logger samtaler konsekvent over tid?
- Hvilke mønstre er det interessant å se, og hvordan vil de informere prioritering?
- Er tidsbruk på logging verdt innsikten man får tilbake?`;

/**
 * Mock response for an early-stage idea
 */
export const MOCK_RESPONSE_EARLY_IDEA = `## Antagelser i teksten

- Det kan ligge en antakelse om at det finnes mennesker som opplever dette som et problem
- Teksten antyder at en løsning på dette vil være verdifull for noen
- Det virker som teksten forutsetter at problemet er stort nok til at folk vil endre adferd

## Åpne spørsmål teksten reiser

- Hvem er det egentlig som opplever dette?
- Hva gjør de i dag for å håndtere det?
- Hvor viktig er dette sammenlignet med andre utfordringer de har?`;

/**
 * Mock response for a more defined concept
 */
export const MOCK_RESPONSE_DEFINED_CONCEPT = `## Antagelser i teksten

- Teksten antyder at småbedriftseiere opplever fakturering som tidkrevende
- Det kan ligge en antakelse om at en mobilapp er riktig format for denne oppgaven
- Det virker som teksten forutsetter at ett-klikks-fakturering er mulig å bygge
- Teksten antyder at tidsbesparelse er det viktigste for denne målgruppen

## Åpne spørsmål teksten reiser

- Hvor mye tid bruker småbedriftseiere faktisk på fakturering i dag?
- Hva bruker de nå, og hva er det som gjør det tidkrevende?
- Er mobil det foretrukne formatet for denne typen oppgaver?
- Hva skal til for at de vil bytte fra noe de allerede bruker?`;

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
