/**
 * Types and utilities for parsing KonseptSpeil MVP results
 * Output is now simple Markdown with two sections
 */

export interface ParsedKonseptSpeilResult {
  antagelser: string[];
  sporsmal: string[];
  isComplete: boolean;
  parseError: string | null;
}

/**
 * Extract bullet points from a Markdown section
 */
function extractBulletPoints(text: string): string[] {
  const lines = text.split('\n');
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines starting with - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.slice(2).trim();
      if (content) {
        bullets.push(content);
      }
    }
  }

  return bullets;
}

/**
 * Parse the MVP KonseptSpeil result from raw Markdown output
 */
export function parseKonseptSpeilResult(text: string): ParsedKonseptSpeilResult {
  if (!text || text.trim().length === 0) {
    return {
      antagelser: [],
      sporsmal: [],
      isComplete: false,
      parseError: null,
    };
  }

  try {
    const content = text.trim();

    // Find the two sections using regex
    // Section 1: "Antagelser i teksten" (or variations)
    // Section 2: "Åpne spørsmål teksten reiser" (or variations)

    const antagelserMatch = content.match(
      /##\s*Antagelser i teksten\s*([\s\S]*?)(?=##|$)/i
    );
    const sporsmalMatch = content.match(
      /##\s*Åpne spørsmål(?:\s+teksten reiser)?\s*([\s\S]*?)(?=##|$)/i
    );

    const antagelser = antagelserMatch
      ? extractBulletPoints(antagelserMatch[1])
      : [];
    const sporsmal = sporsmalMatch
      ? extractBulletPoints(sporsmalMatch[1])
      : [];

    // Consider complete if we have at least one item in each section
    const isComplete = antagelser.length > 0 && sporsmal.length > 0;

    return {
      antagelser,
      sporsmal,
      isComplete,
      parseError: null,
    };
  } catch (error) {
    console.error('Failed to parse KonseptSpeil result:', error);
    return {
      antagelser: [],
      sporsmal: [],
      isComplete: false,
      parseError: 'Kunne ikke tolke svaret',
    };
  }
}

/**
 * Check if the result has any meaningful content
 */
export function hasContent(result: ParsedKonseptSpeilResult): boolean {
  return result.antagelser.length > 0 || result.sporsmal.length > 0;
}
