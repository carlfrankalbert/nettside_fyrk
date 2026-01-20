/**
 * Response validator factory for AI tool outputs.
 * Creates validators that check if streaming responses are complete.
 */

import { extractJson, safeJsonParse } from './json-extraction';

/**
 * Validator function that checks if parsed JSON has required fields.
 * Returns true if the response is considered complete.
 */
export type JsonFieldValidator<T> = (parsed: T) => boolean;

/**
 * Creates a response validator function.
 *
 * @param validateFields - Function that validates the parsed JSON has required fields
 * @returns A function that validates raw output strings
 *
 * @example
 * ```ts
 * const isResponseComplete = createResponseValidator<KonseptspeilResponse>(
 *   (parsed) =>
 *     !!parsed.refleksjon_status?.kommentar &&
 *     !!parsed.fokus_sporsmal?.sporsmal
 * );
 * ```
 */
export function createResponseValidator<T>(
  validateFields: JsonFieldValidator<T>
): (output: string) => boolean {
  return (output: string): boolean => {
    if (!output || output.trim().length === 0) {
      return false;
    }

    try {
      const jsonString = extractJson(output);
      const parsed = safeJsonParse<T>(jsonString);

      if (!parsed) {
        return false;
      }

      return validateFields(parsed);
    } catch {
      return false;
    }
  };
}

/**
 * Pre-built validator for Konseptspeil responses.
 * Checks for refleksjon_status, fokus_sporsmal, and dimensjoner fields.
 */
export const isKonseptspeilResponseComplete = createResponseValidator<{
  refleksjon_status?: { kommentar?: string };
  fokus_sporsmal?: { sporsmal?: string };
  dimensjoner?: { verdi?: unknown; brukbarhet?: unknown };
}>((parsed) => {
  const hasRefleksjonStatus = !!parsed.refleksjon_status?.kommentar;
  const hasFokusSporsmal = !!parsed.fokus_sporsmal?.sporsmal;
  const hasDimensjoner = !!parsed.dimensjoner?.verdi && !!parsed.dimensjoner?.brukbarhet;

  return hasRefleksjonStatus && hasFokusSporsmal && hasDimensjoner;
});

/**
 * Pre-built validator for Antakelseskart responses.
 * Checks for beslutning_oppsummert and at least one antakelser category.
 */
export const isAntakelseskartResponseComplete = createResponseValidator<{
  beslutning_oppsummert?: string;
  antakelser?: {
    målgruppe_behov?: unknown[];
    løsning_produkt?: unknown[];
    marked_konkurranse?: unknown[];
    forretning_skalering?: unknown[];
  };
}>((parsed) => {
  const hasBeslutning =
    typeof parsed.beslutning_oppsummert === 'string' &&
    parsed.beslutning_oppsummert.length > 0;

  const hasAntakelser =
    parsed.antakelser &&
    (Array.isArray(parsed.antakelser.målgruppe_behov) ||
      Array.isArray(parsed.antakelser.løsning_produkt) ||
      Array.isArray(parsed.antakelser.marked_konkurranse) ||
      Array.isArray(parsed.antakelser.forretning_skalering));

  return hasBeslutning && !!hasAntakelser;
});

/**
 * Pre-built validator for Pre-Mortem Brief responses.
 * Checks for key section headers in markdown output.
 */
export function isPreMortemResponseComplete(output: string): boolean {
  if (!output || output.trim().length < 200) {
    return false;
  }

  const content = output.toLowerCase();

  // Check for key structural elements that indicate completeness
  const hasBeslutning = content.includes('beslutning');
  const hasPreMortem = content.includes('pre-mortem');
  const hasIndikatorer = content.includes('indikatorer');
  const hasStoppKriterier = content.includes('stopp');
  const hasEierskap = content.includes('eierskap');
  const hasGodBeslutning = content.includes('god beslutning');

  // Require at least 4 of the 6 key sections to consider it complete
  const foundSections = [
    hasBeslutning,
    hasPreMortem,
    hasIndikatorer,
    hasStoppKriterier,
    hasEierskap,
    hasGodBeslutning,
  ].filter(Boolean).length;

  return foundSections >= 4;
}
