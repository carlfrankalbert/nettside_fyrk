/**
 * Parser for Antakelseskart JSON output
 */

import type {
  ParsedAntakelseskartResult,
  GroupedAssumptions,
  Assumption,
  AntakelseskartJsonResponse,
} from '../types/antakelseskart';
import { extractJson } from './json-extraction';

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

  // Extract JSON using shared utility
  const jsonString = extractJson(raw);

  // Check if we found valid JSON boundaries
  if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
    // Try partial parse - might be streaming
    return result;
  }

  try {
    const parsed = JSON.parse(jsonString) as AntakelseskartJsonResponse;

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
