import type { APIRoute } from 'astro';
import { createAIToolHandler } from '../../lib/ai-tool-handler';
import { createWrappedUserMessage } from '../../utils/input-sanitization';
import { isValidKonseptspeilOutput } from '../../utils/output-validators';
import { CACHE_KEY_PREFIXES } from '../../utils/constants';
import { getMockResponseJson } from '../../data/konseptspeil-mock';
import { KONSEPTSPEIL_SYSTEM_PROMPT } from '../../data/prompts';

export const prerender = false;

function getMockOutput(input: string): string | null {
  const mockMode =
    import.meta.env.KONSEPTSPEILET_MOCK === 'true' ||
    import.meta.env.KONSEPTSPEILET_MOCK === true;

  if (mockMode) {
    return getMockResponseJson(input);
  }
  return null;
}

export const POST: APIRoute = createAIToolHandler({
  toolName: 'konseptspeil',
  cacheKeyPrefix: CACHE_KEY_PREFIXES.KONSEPTSPEIL,
  systemPrompt: KONSEPTSPEIL_SYSTEM_PROMPT,
  createUserMessage: (input) =>
    createWrappedUserMessage(
      input,
      'konsept_input',
      'Speil teksten over. Svar KUN med JSON-objektet, ingen tekst før eller etter.'
    ),
  validateOutput: isValidKonseptspeilOutput,
  errorMessage: 'Kunne ikke speile konseptet',
  missingInputMessage: 'Skriv inn en konseptbeskrivelse for å få refleksjon.',
  useCircuitBreaker: true,
  getMockResponse: getMockOutput,
});
