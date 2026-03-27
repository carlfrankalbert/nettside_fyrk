/**
 * Helper utilities for KonseptSpeil result display
 * Extracted from KonseptSpeilResultDisplayV2 for testability
 */

import type { DimensionKey, DimensionStatus, DimensionData, Dimensjoner, ParsedKonseptSpeilResultV2 } from '../types/konseptspeil-v2';
import { DIMENSION_LABELS, STATUS_LABELS } from '../types/konseptspeil-v2';

/**
 * Suggested next steps based on which dimension is most unclear
 */
export const NEXT_STEP_SUGGESTIONS: Record<DimensionKey, string> = {
  verdi: 'Et mulig neste steg kan v\u00e6re \u00e5 konkretisere hvem som har problemet og hvordan det p\u00e5virker dem i dag.',
  brukbarhet: 'Et mulig neste steg kan v\u00e6re \u00e5 beskrive en konkret situasjon der noen ville brukt dette.',
  gjennomforbarhet: 'Et mulig neste steg kan v\u00e6re \u00e5 kartlegge hva som kreves teknisk eller ressursmessig.',
  levedyktighet: 'Et mulig neste steg kan v\u00e6re \u00e5 vurdere hvordan dette kan b\u00e6re seg over tid.',
};

/**
 * Identify the 1-2 most unclear dimensions based on status
 */
export function getMostUnclearDimensions(dimensjoner: Dimensjoner): DimensionKey[] {
  const dimensionKeys: DimensionKey[] = ['verdi', 'brukbarhet', 'gjennomforbarhet', 'levedyktighet'];

  const sorted = dimensionKeys
    .map(key => ({ key, status: dimensjoner[key].status }))
    .sort((a, b) => {
      const priority: Record<DimensionStatus, number> = { ikke_nevnt: 0, antatt: 1, beskrevet: 2 };
      return priority[a.status] - priority[b.status];
    });

  const unclear = sorted.filter(d => d.status !== 'beskrevet');
  if (unclear.length === 0) return [];
  if (unclear.length === 1) return [unclear[0].key];
  if (unclear[0].status === unclear[1].status) {
    return [unclear[0].key, unclear[1].key];
  }
  return [unclear[0].key];
}

/**
 * Generate full analysis as Markdown for clipboard copy
 */
export function generateFullAnalysisMarkdown(parsed: ParsedKonseptSpeilResultV2): string {
  const dimensionKeys: DimensionKey[] = ['verdi', 'brukbarhet', 'gjennomforbarhet', 'levedyktighet'];

  let markdown = `# Konseptspeil-analyse\n\n`;

  if (parsed.refleksjonStatus.kommentar) {
    markdown += `## Oppsummering\n${parsed.refleksjonStatus.kommentar}\n\n`;
  }

  if (parsed.fokusSporsmal.sporsmal) {
    markdown += `## ${parsed.fokusSporsmal.overskrift}\n${parsed.fokusSporsmal.sporsmal}\n`;
    if (parsed.fokusSporsmal.hvorfor) {
      markdown += `\n_${parsed.fokusSporsmal.hvorfor}_\n`;
    }
    markdown += '\n';
  }

  markdown += `## Dimensjoner\n\n`;
  for (const key of dimensionKeys) {
    const labels = DIMENSION_LABELS[key];
    const data: DimensionData = parsed.dimensjoner[key];
    markdown += `### ${labels.name}\n`;
    markdown += `**Status:** ${STATUS_LABELS[data.status]}\n\n`;
    markdown += `${data.observasjon || labels.question}\n\n`;
  }

  if (parsed.antagelserListe.length > 0) {
    markdown += `## Antagelser i teksten\n`;
    for (const antagelse of parsed.antagelserListe) {
      markdown += `- ${antagelse}\n`;
    }
    markdown += '\n';
  }

  markdown += `---\n_Generert med Konseptspeilet \u2013 FYRK_`;
  return markdown;
}
