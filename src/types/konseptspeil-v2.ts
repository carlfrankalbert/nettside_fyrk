/**
 * Types for Konseptspeilet v2 output format
 * Based on Cagan's four product dimensions framework
 */

/**
 * Maturity level indicating how much has been described (not quality)
 * 1-2: Tidlig idé (Early idea)
 * 3: Under utforskning (Being explored)
 * 4: Klart for testing (Ready for testing)
 * 5: Klart for beslutning (Ready for decision)
 */
export type MaturityLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Status indicator for each dimension
 * - not_addressed: 🔴 The dimension is not mentioned
 * - assumed: 🟡 The dimension is mentioned but not validated/explored
 * - described: 🟢 The dimension is described or explored
 */
export type DimensionStatus = 'not_addressed' | 'assumed' | 'described';

/**
 * The four Cagan dimensions
 */
export type DimensionType = 'value' | 'usability' | 'feasibility' | 'viability';

/**
 * A single dimension with its status and description
 */
export interface Dimension {
  type: DimensionType;
  status: DimensionStatus;
  description: string;
}

/**
 * Summary section at the top of results
 */
export interface Summary {
  assumptionCount: number;
  unclearCount: number;
  maturityLevel: MaturityLevel;
  maturityLabel: string;
  recommendation: string;
}

/**
 * The full parsed v2 result
 */
export interface ParsedKonseptSpeilResultV2 {
  summary: Summary;
  dimensions: Dimension[];
  antagelser: string[];
  sporsmal: string[];
  isComplete: boolean;
  parseError: string | null;
}

/**
 * Maturity level labels in Norwegian
 */
export const MATURITY_LABELS: Record<MaturityLevel, string> = {
  1: 'Tidlig idé',
  2: 'Tidlig idé',
  3: 'Under utforskning',
  4: 'Klart for testing',
  5: 'Klart for beslutning',
};

/**
 * Dimension labels in Norwegian
 */
export const DIMENSION_LABELS: Record<DimensionType, { name: string; question: string }> = {
  value: {
    name: 'Verdi',
    question: 'Løser dette et reelt problem for noen?',
  },
  usability: {
    name: 'Brukbarhet',
    question: 'Vil brukerne forstå og bruke løsningen?',
  },
  feasibility: {
    name: 'Gjennomførbarhet',
    question: 'Kan vi faktisk bygge dette?',
  },
  viability: {
    name: 'Levedyktighet',
    question: 'Gir dette mening for virksomheten?',
  },
};

/**
 * Status icons for display
 */
export const STATUS_ICONS: Record<DimensionStatus, string> = {
  not_addressed: '🔴',
  assumed: '🟡',
  described: '🟢',
};
