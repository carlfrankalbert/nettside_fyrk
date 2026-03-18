import type { APIRoute } from 'astro';
import { createAIToolHandler } from '../../lib/ai-tool-handler';
import { createWrappedUserMessage } from '../../utils/input-sanitization';
import { isValidPreMortemOutput } from '../../utils/output-validators';
import { CACHE_KEY_PREFIXES, ANTHROPIC_CONFIG, PRE_MORTEM_VALIDATION } from '../../utils/constants';
import { PRE_MORTEM_SYSTEM_PROMPT } from '../../data/prompts';

export const prerender = false;

export const POST: APIRoute = createAIToolHandler({
  toolName: 'pre-mortem',
  cacheKeyPrefix: CACHE_KEY_PREFIXES.PRE_MORTEM,
  systemPrompt: PRE_MORTEM_SYSTEM_PROMPT,
  createUserMessage: (input) =>
    createWrappedUserMessage(
      input,
      'premortem_input',
      'Utarbeid et Pre-Mortem Brief basert på denne beslutningsinformasjonen. Følg output-strukturen nøyaktig.'
    ),
  validateOutput: isValidPreMortemOutput,
  errorMessage: 'Kunne ikke generere Pre-Mortem Brief',
  missingInputMessage: 'Fyll ut beslutningsinformasjonen for å generere Pre-Mortem Brief.',
  useCircuitBreaker: true,
  streamingTimeoutMs: ANTHROPIC_CONFIG.PRE_MORTEM_REQUEST_TIMEOUT_MS,
  maxInputLength: PRE_MORTEM_VALIDATION.MAX_TOTAL_LENGTH + 500, // JSON overhead
});
