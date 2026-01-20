/**
 * Output Validators for AI Tool Responses
 *
 * Validates that AI responses conform to expected formats.
 * Helps prevent prompt injection by rejecting malformed outputs.
 *
 * Used by: okr-sjekken, konseptspeilet, antakelseskart
 */

import { containsSuspiciousPatterns } from './input-sanitization';

/**
 * Validate konseptspeilet output format
 * Expects JSON with refleksjon_status, fokus_sporsmal, dimensjoner, antagelser_liste
 */
export function isValidKonseptspeilOutput(output: string): boolean {
  if (!output || output.trim().length === 0) return false;

  const content = output.trim();

  if (containsSuspiciousPatterns(content)) return false;

  try {
    const parsed = JSON.parse(content);

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

    return hasRefleksjonStatus && hasFokusSporsmal && hasDimensjoner && hasAntagelserListe;
  } catch {
    return false;
  }
}

/**
 * Validate antakelseskart output format
 * Expects JSON with beslutning_oppsummert, antakelser (4 categories), antall_totalt
 */
export function isValidAntakelseskartOutput(output: string): boolean {
  if (!output || output.trim().length === 0) return false;

  const content = output.trim();

  if (containsSuspiciousPatterns(content)) return false;

  try {
    const parsed = JSON.parse(content);

    const hasBeslutning = typeof parsed.beslutning_oppsummert === 'string';
    const hasAntakelser =
      parsed.antakelser &&
      Array.isArray(parsed.antakelser.målgruppe_behov) &&
      Array.isArray(parsed.antakelser.løsning_produkt) &&
      Array.isArray(parsed.antakelser.marked_konkurranse) &&
      Array.isArray(parsed.antakelser.forretning_skalering);
    const hasAntall = typeof parsed.antall_totalt === 'number';

    return hasBeslutning && hasAntakelser && hasAntall;
  } catch {
    return false;
  }
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
