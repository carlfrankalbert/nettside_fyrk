import type { APIRoute } from 'astro';
import { createAIToolHandler } from '../../lib/ai-tool-handler';
import { createWrappedUserMessage } from '../../utils/input-sanitization';
import { isValidOKROutput } from '../../utils/output-validators';
import { CACHE_KEY_PREFIXES } from '../../utils/constants';
import { OKR_SYSTEM_PROMPT } from '../../data/prompts';

export const prerender = false;

export const POST: APIRoute = createAIToolHandler({
  toolName: 'okr',
  cacheKeyPrefix: CACHE_KEY_PREFIXES.OKR,
  systemPrompt: OKR_SYSTEM_PROMPT,
  createUserMessage: (input) =>
    createWrappedUserMessage(
      input,
      'okr_input',
      'Vurder OKR-settet over. Følg output-formatet fra system-prompten.'
    ),
  validateOutput: isValidOKROutput,
  errorMessage: 'Kunne ikke vurdere OKR-settet',
  missingInputMessage: 'Skriv inn et OKR-sett for vurdering.',
  maxTokens: 2048,
  useCircuitBreaker: true,
});
