/**
 * Types for Konseptspeilet v2 JSON output format
 * Based on Cagan's four product dimensions framework
 */

/**
 * Status indicator for each dimension (Norwegian)
 * - ikke_nevnt: Not mentioned in the text
 * - antatt: Mentioned but not validated/explored
 * - beskrevet: Described with concrete examples/data
 */
export type DimensionStatus = 'ikke_nevnt' | 'antatt' | 'beskrevet';

/**
 * The four dimension keys in Norwegian
 */
export type DimensionKey = 'verdi' | 'brukbarhet' | 'gjennomforbarhet' | 'levedyktighet';

/**
 * A single dimension with its status and observation
 */
export interface DimensionData {
  status: DimensionStatus;
  observasjon: string;
}

/**
 * All four dimensions
 */
export interface Dimensjoner {
  verdi: DimensionData;
  brukbarhet: DimensionData;
  gjennomforbarhet: DimensionData;
  levedyktighet: DimensionData;
}

/**
 * Reflection status summary
 */
export interface RefleksjonStatus {
  kommentar: string;
  antagelser_funnet: number;
}

/**
 * Focus question section
 */
export interface FokusSporsmal {
  overskrift: string;
  sporsmal: string;
  hvorfor: string;
}

/**
 * The raw JSON response from the AI
 */
export interface KonseptspeilJsonResponse {
  refleksjon_status: RefleksjonStatus;
  fokus_sporsmal: FokusSporsmal;
  dimensjoner: Dimensjoner;
  antagelser_liste: string[];
}

/**
 * The parsed result with additional metadata
 */
export interface ParsedKonseptSpeilResultV2 {
  refleksjonStatus: RefleksjonStatus;
  fokusSporsmal: FokusSporsmal;
  dimensjoner: Dimensjoner;
  antagelserListe: string[];
  isComplete: boolean;
  parseError: string | null;
}

/**
 * Dimension labels in Norwegian for display
 */
export const DIMENSION_LABELS: Record<DimensionKey, { name: string; question: string }> = {
  verdi: {
    name: 'Verdi',
    question: 'Er problemet og behovet konkretisert?',
  },
  brukbarhet: {
    name: 'Brukbarhet',
    question: 'Er situasjonen for bruk beskrevet?',
  },
  gjennomforbarhet: {
    name: 'Gjennomførbarhet',
    question: 'Er ressurser, teknikk eller tid nevnt konkret?',
  },
  levedyktighet: {
    name: 'Levedyktighet',
    question: 'Er forretningsmodell eller bærekraft nevnt?',
  },
};

/**
 * Status icons for display
 */
export const STATUS_ICONS: Record<DimensionStatus, string> = {
  ikke_nevnt: '🔴',
  antatt: '🟡',
  beskrevet: '🟢',
};

/**
 * Status labels in Norwegian
 */
export const STATUS_LABELS: Record<DimensionStatus, string> = {
  ikke_nevnt: 'Ikke nevnt',
  antatt: 'Antatt',
  beskrevet: 'Beskrevet',
};
