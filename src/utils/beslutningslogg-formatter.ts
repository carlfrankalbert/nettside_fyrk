/**
 * Beslutningslogg formatter utility
 * Formats decision log data into structured Markdown
 */

export interface BeslutningsloggData {
  beslutning: string;
  dato: string;
  deltakere?: string;
  kritiskeAntakelser?: string[];
  akseptertUsikkerhet?: string[];
}

/**
 * Format a date string to Norwegian locale format
 */
export function formatDateNorwegian(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Parse multiline text input into an array of non-empty lines
 */
export function parseMultilineInput(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Format decision log data as Markdown
 */
export function formatBeslutningsloggMarkdown(data: BeslutningsloggData): string {
  const lines: string[] = [];

  // Header
  lines.push('# Beslutningslogg');
  lines.push('');

  // Beslutning (always present)
  lines.push('## Beslutning');
  lines.push('');
  lines.push(data.beslutning.trim());
  lines.push('');

  // Grunnlag section (only if there are assumptions or uncertainties)
  const hasAntakelser = data.kritiskeAntakelser && data.kritiskeAntakelser.length > 0;
  const hasUsikkerhet = data.akseptertUsikkerhet && data.akseptertUsikkerhet.length > 0;

  if (hasAntakelser || hasUsikkerhet) {
    lines.push('## Grunnlag');
    lines.push('');

    if (hasAntakelser) {
      lines.push('### Kritiske antakelser');
      lines.push('');
      for (const antakelse of data.kritiskeAntakelser!) {
        lines.push(`- ${antakelse}`);
      }
      lines.push('');
    }

    if (hasUsikkerhet) {
      lines.push('### Akseptert usikkerhet');
      lines.push('');
      for (const usikkerhet of data.akseptertUsikkerhet!) {
        lines.push(`- ${usikkerhet}`);
      }
      lines.push('');
    }
  }

  // Dato
  lines.push('## Dato');
  lines.push('');
  lines.push(formatDateNorwegian(data.dato));
  lines.push('');

  // Deltakere (only if provided)
  if (data.deltakere && data.deltakere.trim().length > 0) {
    lines.push('## Deltakere');
    lines.push('');
    lines.push(data.deltakere.trim());
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Validation constants for Beslutningslogg
 */
export const BESLUTNINGSLOGG_VALIDATION = {
  MIN_BESLUTNING_LENGTH: 20,
  MAX_BESLUTNING_LENGTH: 500,
} as const;

/**
 * Validate the beslutning (decision) field
 * Returns error message if invalid, null if valid
 */
export function validateBeslutning(input: string): string | null {
  const trimmed = input.trim();

  if (trimmed.length < BESLUTNINGSLOGG_VALIDATION.MIN_BESLUTNING_LENGTH) {
    return `Beslutningen må være minst ${BESLUTNINGSLOGG_VALIDATION.MIN_BESLUTNING_LENGTH} tegn.`;
  }

  if (trimmed.length > BESLUTNINGSLOGG_VALIDATION.MAX_BESLUTNING_LENGTH) {
    return `Beslutningen kan ikke være lengre enn ${BESLUTNINGSLOGG_VALIDATION.MAX_BESLUTNING_LENGTH} tegn.`;
  }

  return null;
}
