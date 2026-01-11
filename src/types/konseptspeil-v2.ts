/**
 * Types for Konseptspeilet v2 output format
 * Based on Cagan's four product dimensions framework
 */

/**
 * Exploration level indicating how much has been made explicit (not quality)
 * Renamed from "Modenhet" to avoid implicit judgment.
 * 1-2: Lite utforsket (Little explored)
 * 3: Under utforskning (Being explored)
 * 4: Mye beskrevet (Well described)
 * 5: Grundig utforsket (Thoroughly explored)
 */
export type ExplorationLevel = 1 | 2 | 3 | 4 | 5;

/** @deprecated Use ExplorationLevel instead */
export type MaturityLevel = ExplorationLevel;

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
  explorationLevel: ExplorationLevel;
  explorationLabel: string;
  /** Optional conditional next step (not directive) */
  conditionalStep: string;
  /** @deprecated Use explorationLevel instead */
  maturityLevel?: ExplorationLevel;
  /** @deprecated Use explorationLabel instead */
  maturityLabel?: string;
  /** @deprecated Use conditionalStep instead */
  recommendation?: string;
}

/**
 * The full parsed v2 result
 */
export interface ParsedKonseptSpeilResultV2 {
  summary: Summary;
  dimensions: Dimension[];
  antagelser: string[];
  sporsmal: string[];
  /** The single most important thing to explore first (synthesis) */
  priorityExploration: string | null;
  isComplete: boolean;
  parseError: string | null;
}

/**
 * Exploration level labels in Norwegian
 * These describe what has been made explicit, not idea quality
 */
export const EXPLORATION_LABELS: Record<ExplorationLevel, string> = {
  1: 'Lite utforsket',
  2: 'Lite utforsket',
  3: 'Under utforskning',
  4: 'Mye beskrevet',
  5: 'Grundig utforsket',
};

/** @deprecated Use EXPLORATION_LABELS instead */
export const MATURITY_LABELS = EXPLORATION_LABELS;

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
