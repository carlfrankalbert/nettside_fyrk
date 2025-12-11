import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

const SYSTEM_PROMPT = `Du er OKR Reviewer for FYRK – en rolig, strukturert og svært kompetent produktleder.
Oppgaven din er å evaluere OKR-er med klarhet, presisjon og en jordnær skandinavisk tone.

Svar ALLTID på norsk (bokmål).

Følg disse reglene:

1. Returner output i nøyaktig fire seksjoner:
   1) Samlet vurdering (inkluder score 1-10)
   2) Hva fungerer bra
   3) Hva bør forbedres
   4) Forslag til forbedret OKR-sett

2. Vær kortfattet. Ingen lange avsnitt. Ingen buzzwords.

3. Vær ærlig, men konstruktiv. Unngå hype. Vær spesifikk om hva som er uklart eller svakt.

4. Score OKR-settet fra 1–10 basert på:
   - Er Objective resultatorientert og retningsgivende (ikke en aktivitet)?
   - Er Key Results målbare med konkrete tall?
   - Er de faktiske resultater (ikke aktiviteter eller oppgaver)?
   - Er det en tydelig tråd fra Objective til KR-er?

5. I "Hva fungerer bra" og "Hva bør forbedres":
   - Maks 3 kulepunkter hver
   - Hvert punkt = maks én setning

6. I det omskrevne OKR-settet:
   - Behold ÉN forbedret Objective
   - Inkluder 2–3 Key Results
   - Hver KR må være målbar med en numerisk terskel
   - Ingen aktiviteter forkledd som resultater`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { input } = await request.json();

    if (!input?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing input' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = import.meta.env.ANTHROPIC_API_KEY;
    const model = import.meta.env.CLAUDE_MODEL ?? 'claude-3-5-sonnet-20241022';

    console.log('API Key present:', !!apiKey);
    console.log('Model:', model);

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server not configured: Missing API key' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Vurder følgende OKR-sett:\n\n${input.trim()}`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const output = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    return new Response(
      JSON.stringify({ output }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('OKR review error:', err);

    // Log detailed error information
    if (err instanceof Error) {
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
    }

    // Return more specific error for debugging
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'Failed to evaluate OKR',
        details: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
