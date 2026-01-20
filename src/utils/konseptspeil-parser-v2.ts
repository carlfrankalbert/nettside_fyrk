/**
 * Parser for Konseptspeilet v2 JSON output format
 */

import type {
  ParsedKonseptSpeilResultV2,
  KonseptspeilJsonResponse,
  RefleksjonStatus,
  FokusSporsmal,
  Dimensjoner,
  DimensionData,
  DimensionStatus,
} from '../types/konseptspeil-v2';
import { extractJson, safeJsonParse } from './json-extraction';

/**
 * Default empty reflection status
 */
function createDefaultRefleksjonStatus(): RefleksjonStatus {
  return {
    kommentar: '',
    antagelser_funnet: 0,
  };
}

/**
 * Default empty focus question
 */
function createDefaultFokusSporsmal(): FokusSporsmal {
  return {
    overskrift: 'HVIS DU VIL UTFORSKE ÉN TING VIDERE',
    sporsmal: '',
    hvorfor: '',
  };
}

/**
 * Default empty dimension data
 */
function createDefaultDimensionData(): DimensionData {
  return {
    status: 'ikke_nevnt',
    observasjon: '',
  };
}

/**
 * Default empty dimensions
 */
function createDefaultDimensjoner(): Dimensjoner {
  return {
    verdi: createDefaultDimensionData(),
    brukbarhet: createDefaultDimensionData(),
    gjennomforbarhet: createDefaultDimensionData(),
    levedyktighet: createDefaultDimensionData(),
  };
}

/**
 * Validate and normalize dimension status
 */
function normalizeDimensionStatus(status: string | undefined): DimensionStatus {
  const normalized = (status || '').toLowerCase().trim();
  if (normalized === 'beskrevet') return 'beskrevet';
  if (normalized === 'antatt') return 'antatt';
  return 'ikke_nevnt';
}

/**
 * Safely parse dimension data
 */
function parseDimensionData(data: unknown): DimensionData {
  if (!data || typeof data !== 'object') {
    return createDefaultDimensionData();
  }

  const d = data as Record<string, unknown>;
  return {
    status: normalizeDimensionStatus(d.status as string),
    observasjon: typeof d.observasjon === 'string' ? d.observasjon : '',
  };
}

/**
 * Parse the v2 KonseptSpeil JSON result from raw output
 */
export function parseKonseptSpeilResultV2(text: string): ParsedKonseptSpeilResultV2 {
  if (!text || text.trim().length === 0) {
    return {
      refleksjonStatus: createDefaultRefleksjonStatus(),
      fokusSporsmal: createDefaultFokusSporsmal(),
      dimensjoner: createDefaultDimensjoner(),
      antagelserListe: [],
      isComplete: false,
      parseError: null,
    };
  }

  const jsonText = extractJson(text);
  const parsed = safeJsonParse<KonseptspeilJsonResponse>(jsonText);

  if (!parsed) {
    return {
      refleksjonStatus: createDefaultRefleksjonStatus(),
      fokusSporsmal: createDefaultFokusSporsmal(),
      dimensjoner: createDefaultDimensjoner(),
      antagelserListe: [],
      isComplete: false,
      parseError: 'Kunne ikke tolke svaret som JSON',
    };
  }

  // Parse refleksjon_status
    const refleksjonStatus: RefleksjonStatus = {
      kommentar: parsed.refleksjon_status?.kommentar || '',
      antagelser_funnet: typeof parsed.refleksjon_status?.antagelser_funnet === 'number'
        ? parsed.refleksjon_status.antagelser_funnet
        : 0,
    };

    // Parse fokus_sporsmal
    const fokusSporsmal: FokusSporsmal = {
      overskrift: parsed.fokus_sporsmal?.overskrift || 'HVIS DU VIL UTFORSKE ÉN TING VIDERE',
      sporsmal: parsed.fokus_sporsmal?.sporsmal || '',
      hvorfor: parsed.fokus_sporsmal?.hvorfor || '',
    };

    // Parse dimensjoner
    const dimensjoner: Dimensjoner = {
      verdi: parseDimensionData(parsed.dimensjoner?.verdi),
      brukbarhet: parseDimensionData(parsed.dimensjoner?.brukbarhet),
      gjennomforbarhet: parseDimensionData(parsed.dimensjoner?.gjennomforbarhet),
      levedyktighet: parseDimensionData(parsed.dimensjoner?.levedyktighet),
    };

    // Parse antagelser_liste
    const antagelserListe = Array.isArray(parsed.antagelser_liste)
      ? parsed.antagelser_liste.filter((item): item is string => typeof item === 'string')
      : [];

    // Check completeness
    const isComplete =
      refleksjonStatus.kommentar.length > 0 &&
      fokusSporsmal.sporsmal.length > 0 &&
      (dimensjoner.verdi.observasjon.length > 0 ||
        dimensjoner.brukbarhet.observasjon.length > 0 ||
        dimensjoner.gjennomforbarhet.observasjon.length > 0 ||
        dimensjoner.levedyktighet.observasjon.length > 0);

  return {
    refleksjonStatus,
    fokusSporsmal,
    dimensjoner,
    antagelserListe,
    isComplete,
    parseError: null,
  };
}

/**
 * Check if the result has any meaningful content (for streaming display)
 */
export function hasContentV2(result: ParsedKonseptSpeilResultV2): boolean {
  return (
    result.refleksjonStatus.kommentar.length > 0 ||
    result.fokusSporsmal.sporsmal.length > 0 ||
    result.antagelserListe.length > 0 ||
    result.dimensjoner.verdi.observasjon.length > 0 ||
    result.dimensjoner.brukbarhet.observasjon.length > 0 ||
    result.dimensjoner.gjennomforbarhet.observasjon.length > 0 ||
    result.dimensjoner.levedyktighet.observasjon.length > 0
  );
}

/**
 * Check if the response text looks like JSON format
 */
export function isV2Format(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('{') || trimmed.includes('"refleksjon_status"');
}
