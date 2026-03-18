import type { APIRoute } from 'astro';
import { createAIToolHandler } from '../../lib/ai-tool-handler';
import { createWrappedUserMessage } from '../../utils/input-sanitization';
import { isValidAntakelseskartOutput } from '../../utils/output-validators';
import { CACHE_KEY_PREFIXES } from '../../utils/constants';
import { ANTAKELSESKART_SYSTEM_PROMPT } from '../../data/prompts';

export const prerender = false;

export const POST: APIRoute = createAIToolHandler({
  toolName: 'antakelseskart',
  cacheKeyPrefix: CACHE_KEY_PREFIXES.ANTAKELSESKART,
  systemPrompt: ANTAKELSESKART_SYSTEM_PROMPT,
  createUserMessage: (input) =>
    createWrappedUserMessage(
      input,
      'beslutning_input',
      'Avdekk de implisitte antakelsene i denne beslutningsbeskrivelsen. Svar KUN med JSON-objektet, ingen tekst før eller etter.'
    ),
  validateOutput: isValidAntakelseskartOutput,
  errorMessage: 'Kunne ikke avdekke antakelser',
  missingInputMessage: 'Skriv inn en beslutningsbeskrivelse for å avdekke antakelser.',
  maxTokens: 2500,
  useCircuitBreaker: true,
});
