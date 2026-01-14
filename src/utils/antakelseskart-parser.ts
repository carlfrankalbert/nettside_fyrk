/**
 * Parser for Antakelseskart JSON output
 */

import type {
  ParsedAntakelseskartResult,
  GroupedAssumptions,
  Assumption,
  AntakelseskartJsonResponse,
} from '../types/antakelseskart';

/**
 * Default empty grouped assumptions
 */
const EMPTY_GROUPED: GroupedAssumptions = {
  målgruppe_behov: [],
  løsning_produkt: [],
  marked_konkurranse: [],
  forretning_skalering: [],
};

/**
 * Parse raw JSON string into structured result
 */
export function parseAntakelseskartResult(raw: string): ParsedAntakelseskartResult {
  const result: ParsedAntakelseskartResult = {
    beslutningOppsummert: '',
    antakelser: { ...EMPTY_GROUPED },
    antallTotalt: 0,
    isComplete: false,
    parseError: null,
  };

  if (!raw || raw.trim().length === 0) {
    return result;
  }

  // Try to extract JSON from the raw string
  const trimmed = raw.trim();
  let jsonString = trimmed;

  // Handle case where JSON might be wrapped in markdown code blocks
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1].trim();
  }

  // Find the JSON object boundaries
  const jsonStart = jsonString.indexOf('{');
  const jsonEnd = jsonString.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    // Try partial parse - might be streaming
    return result;
  }

  try {
    const parsed = JSON.parse(jsonString.substring(jsonStart, jsonEnd + 1)) as AntakelseskartJsonResponse;

    // Extract beslutning_oppsummert
    if (typeof parsed.beslutning_oppsummert === 'string') {
      result.beslutningOppsummert = parsed.beslutning_oppsummert;
    }

    // Extract antakelser
    if (parsed.antakelser) {
      const categories = ['målgruppe_behov', 'løsning_produkt', 'marked_konkurranse', 'forretning_skalering'] as const;

      for (const category of categories) {
        if (Array.isArray(parsed.antakelser[category])) {
          result.antakelser[category] = parsed.antakelser[category].map((a, i) => ({
            id: a.id || `${category.substring(0, 2)}${i + 1}`,
            text: a.text || '',
            category: category,
            certainty: a.certainty,
            consequence: a.consequence,
            status: a.status,
          }));
        }
      }
    }

    // Calculate total
    const totalFromCategories =
      result.antakelser.målgruppe_behov.length +
      result.antakelser.løsning_produkt.length +
      result.antakelser.marked_konkurranse.length +
      result.antakelser.forretning_skalering.length;

    result.antallTotalt = parsed.antall_totalt || totalFromCategories;

    // Mark as complete if we have the essential fields
    result.isComplete =
      result.beslutningOppsummert.length > 0 &&
      totalFromCategories > 0;

  } catch {
    // During streaming, incomplete JSON is expected
    // Only set parseError if we're clearly done streaming
    if (jsonString.includes('[DONE]')) {
      result.parseError = 'Kunne ikke tolke svaret fra AI-en. Vennligst prøv igjen.';
    }
  }

  return result;
}

/**
 * Check if parsed result has enough content to display
 */
export function hasContent(parsed: ParsedAntakelseskartResult): boolean {
  const totalAssumptions =
    parsed.antakelser.målgruppe_behov.length +
    parsed.antakelser.løsning_produkt.length +
    parsed.antakelser.marked_konkurranse.length +
    parsed.antakelser.forretning_skalering.length;

  return parsed.beslutningOppsummert.length > 0 || totalAssumptions > 0;
}

/**
 * Get all assumptions as a flat array
 */
export function getAllAssumptions(grouped: GroupedAssumptions): Assumption[] {
  return [
    ...grouped.målgruppe_behov,
    ...grouped.løsning_produkt,
    ...grouped.marked_konkurranse,
    ...grouped.forretning_skalering,
  ];
}
