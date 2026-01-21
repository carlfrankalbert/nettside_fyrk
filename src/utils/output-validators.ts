/**
 * Output Validators for AI Tool Responses (Server-side)
 *
 * Validates that AI responses conform to expected formats.
 * Helps prevent prompt injection by rejecting malformed outputs.
 * These are strict validators used before caching on the server.
 *
 * Note: Client-side completeness checks are in response-validator.ts
 * (looser checks for determining when streaming is "done enough")
 *
 * Used by: okr-sjekken, konseptspeilet, antakelseskart, pre-mortem
 */

import { containsSuspiciousPatterns } from './input-sanitization';
import { safeJsonParse } from './json-extraction';

/**
 * Validate konseptspeilet output format
 * Expects JSON with refleksjon_status, fokus_sporsmal, dimensjoner, antagelser_liste
 */
export function isValidKonseptspeilOutput(output: string): boolean {
  if (!output || output.trim().length === 0) return false;

  const content = output.trim();

  if (containsSuspiciousPatterns(content)) return false;

  const parsed = safeJsonParse<{
    refleksjon_status?: { kommentar?: unknown; antagelser_funnet?: unknown };
    fokus_sporsmal?: { sporsmal?: unknown };
    dimensjoner?: { verdi?: unknown; brukbarhet?: unknown; gjennomforbarhet?: unknown; levedyktighet?: unknown };
    antagelser_liste?: unknown;
  }>(content);

  if (!parsed) return false;

  const hasRefleksjonStatus =
    parsed.refleksjon_status &&
    typeof parsed.refleksjon_status.kommentar === 'string' &&
    typeof parsed.refleksjon_status.antagelser_funnet === 'number';

  const hasFokusSporsmal =
    parsed.fokus_sporsmal && typeof parsed.fokus_sporsmal.sporsmal === 'string';

  const hasDimensjoner =
    parsed.dimensjoner &&
    parsed.dimensjoner.verdi &&
    parsed.dimensjoner.brukbarhet &&
    parsed.dimensjoner.gjennomforbarhet &&
    parsed.dimensjoner.levedyktighet;

  const hasAntagelserListe = Array.isArray(parsed.antagelser_liste);

  return !!(hasRefleksjonStatus && hasFokusSporsmal && hasDimensjoner && hasAntagelserListe);
}

/**
 * Validate antakelseskart output format
 * Expects JSON with beslutning_oppsummert, antakelser (4 categories), antall_totalt
 */
export function isValidAntakelseskartOutput(output: string): boolean {
  if (!output || output.trim().length === 0) return false;

  const content = output.trim();

  if (containsSuspiciousPatterns(content)) return false;

  const parsed = safeJsonParse<{
    beslutning_oppsummert?: unknown;
    antakelser?: {
      målgruppe_behov?: unknown;
      løsning_produkt?: unknown;
      marked_konkurranse?: unknown;
      forretning_skalering?: unknown;
    };
    antall_totalt?: unknown;
  }>(content);

  if (!parsed) return false;

  const hasBeslutning = typeof parsed.beslutning_oppsummert === 'string';
  const hasAntakelser =
    parsed.antakelser &&
    Array.isArray(parsed.antakelser.målgruppe_behov) &&
    Array.isArray(parsed.antakelser.løsning_produkt) &&
    Array.isArray(parsed.antakelser.marked_konkurranse) &&
    Array.isArray(parsed.antakelser.forretning_skalering);
  const hasAntall = typeof parsed.antall_totalt === 'number';

  return !!(hasBeslutning && hasAntakelser && hasAntall);
}

/**
 * Validate OKR-sjekken output format
 * Expects text with score (X/10) and standard review sections
 */
export function isValidOKROutput(output: string): boolean {
  if (!output || output.trim().length < 100) return false;

  const content = output.toLowerCase();

  // Check for expected sections in OKR review output
  const hasScore = /\d+\s*\/\s*10/.test(output);
  const hasSections =
    (content.includes('vurdering') || content.includes('score')) &&
    (content.includes('fungerer') || content.includes('bra')) &&
    (content.includes('forbedres') || content.includes('forslag'));

  return hasScore || hasSections;
}

/**
 * Validate Pre-Mortem Brief output format
 * Expects markdown text with specific sections
 */
export function isValidPreMortemOutput(output: string): boolean {
  if (!output || output.trim().length < 200) return false;

  const content = output.toLowerCase();

  if (containsSuspiciousPatterns(content)) return false;

  // Check for required section headers (case-insensitive)
  const requiredSections = [
    'beslutning',
    'ramme',
    'pre-mortem',
    'indikatorer',
    'kontroller',
    'stopp',
    'eierskap',
    'god beslutning',
  ];

  // Require at least 5 of the 8 main sections to be present
  const foundSections = requiredSections.filter((section) => content.includes(section));

  return foundSections.length >= 5;
}
