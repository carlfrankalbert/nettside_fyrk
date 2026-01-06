/**
 * Types and utilities for parsing KonseptSpeil results
 */

export type FaseStatus = 'utforskning' | 'forming' | 'forpliktelse';
export type Modenhet = 'antakelse' | 'hypotese' | 'tidlig-signal' | 'validert';

export interface Observasjon {
  tilstede: string | null;
  uutforsket: string | null;
  modenhet: Modenhet;
}

export interface ParsedKonseptSpeilResult {
  kort_vurdering: string;
  fase: {
    status: FaseStatus;
    begrunnelse: string;
  };
  observasjoner: {
    bruker: Observasjon | null;
    brukbarhet: Observasjon | null;
    gjennomførbarhet: Observasjon | null;
    levedyktighet: Observasjon | null;
  };
  kjerneantagelse: string;
  neste_steg: string[];
  isComplete: boolean;
  parseError: string | null;
}

/**
 * Labels for display in Norwegian
 */
export const FASE_LABELS: Record<FaseStatus, string> = {
  utforskning: 'Utforskning',
  forming: 'Forming',
  forpliktelse: 'Forpliktelse',
};

export const MODENHET_LABELS: Record<Modenhet, string> = {
  antakelse: 'Antakelse',
  hypotese: 'Hypotese',
  'tidlig-signal': 'Tidlig signal',
  validert: 'Validert',
};

export const OBSERVASJON_LABELS: Record<string, string> = {
  bruker: 'Bruker',
  brukbarhet: 'Brukbarhet',
  gjennomførbarhet: 'Gjennomførbarhet',
  levedyktighet: 'Levedyktighet',
};

/**
 * Get color classes for modenhet level
 */
export function getModenhetColor(modenhet: Modenhet): {
  bg: string;
  text: string;
  border: string;
} {
  switch (modenhet) {
    case 'validert':
      return {
        bg: 'bg-feedback-success/10',
        text: 'text-feedback-success',
        border: 'border-feedback-success/30',
      };
    case 'tidlig-signal':
      return {
        bg: 'bg-feedback-info/10',
        text: 'text-feedback-info',
        border: 'border-feedback-info/30',
      };
    case 'hypotese':
      return {
        bg: 'bg-feedback-warning/10',
        text: 'text-feedback-warning',
        border: 'border-feedback-warning/30',
      };
    case 'antakelse':
    default:
      return {
        bg: 'bg-neutral-100',
        text: 'text-neutral-600',
        border: 'border-neutral-300',
      };
  }
}

/**
 * Get color classes for fase status
 */
export function getFaseColor(status: FaseStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'forpliktelse':
      return {
        bg: 'bg-feedback-success/10',
        text: 'text-feedback-success',
        border: 'border-feedback-success/30',
      };
    case 'forming':
      return {
        bg: 'bg-feedback-info/10',
        text: 'text-feedback-info',
        border: 'border-feedback-info/30',
      };
    case 'utforskning':
    default:
      return {
        bg: 'bg-brand-cyan-lightest/50',
        text: 'text-brand-cyan-darker',
        border: 'border-brand-cyan/30',
      };
  }
}

/**
 * Check if text appears to be incomplete streaming JSON
 */
function isIncompleteStreamingJSON(text: string): boolean {
  const trimmed = text.trim();

  // Check for incomplete markdown code blocks
  if (trimmed.startsWith('```') && !trimmed.includes('```', 3)) {
    return true;
  }

  // Count braces to detect incomplete JSON
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;

  for (const char of trimmed) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') braceCount++;
    else if (char === '}') braceCount--;
    else if (char === '[') bracketCount++;
    else if (char === ']') bracketCount--;
  }

  // If braces/brackets are unbalanced, JSON is incomplete
  return braceCount !== 0 || bracketCount !== 0;
}

/**
 * Extract JSON from a string that might contain markdown code blocks
 */
function extractJSON(text: string): string {
  let cleaned = text.trim();

  // Remove markdown code blocks if present (handle both complete and incomplete)
  const completeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (completeBlockMatch) {
    return completeBlockMatch[1].trim();
  }

  // Handle incomplete code block at the start (streaming case)
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7).trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3).trim();
  }

  // Handle incomplete code block at the end (streaming case)
  cleaned = cleaned.replace(/`{1,3}$/, '').trim();

  // Try to find JSON object directly
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return cleaned;
}

/**
 * Create an empty/default result for incomplete parsing
 */
function createEmptyResult(parseError: string | null = null): ParsedKonseptSpeilResult {
  return {
    kort_vurdering: '',
    fase: {
      status: 'utforskning',
      begrunnelse: '',
    },
    observasjoner: {
      bruker: null,
      brukbarhet: null,
      gjennomførbarhet: null,
      levedyktighet: null,
    },
    kjerneantagelse: '',
    neste_steg: [],
    isComplete: false,
    parseError,
  };
}

/**
 * Validate and type-check parsed JSON against expected schema
 */
function validateParsedResult(data: unknown): ParsedKonseptSpeilResult {
  if (!data || typeof data !== 'object') {
    return createEmptyResult('Ugyldig JSON-struktur');
  }

  const obj = data as Record<string, unknown>;

  // Extract kort_vurdering
  const kortVurdering = typeof obj.kort_vurdering === 'string' ? obj.kort_vurdering : '';

  // Validate fase
  const fase = obj.fase as Record<string, unknown> | undefined;
  if (!fase || typeof fase !== 'object') {
    return createEmptyResult('Mangler fase-objekt');
  }

  const validFaseStatuses: FaseStatus[] = ['utforskning', 'forming', 'forpliktelse'];
  const faseStatus = validFaseStatuses.includes(fase.status as FaseStatus)
    ? (fase.status as FaseStatus)
    : 'utforskning';

  // Validate observasjoner
  const observasjoner = obj.observasjoner as Record<string, unknown> | undefined;
  const validModenhet: Modenhet[] = ['antakelse', 'hypotese', 'tidlig-signal', 'validert'];

  function parseObservasjon(obs: unknown): Observasjon | null {
    if (!obs || typeof obs !== 'object') return null;
    const o = obs as Record<string, unknown>;
    return {
      tilstede: typeof o.tilstede === 'string' ? o.tilstede : null,
      uutforsket: typeof o.uutforsket === 'string' ? o.uutforsket : null,
      modenhet: validModenhet.includes(o.modenhet as Modenhet)
        ? (o.modenhet as Modenhet)
        : 'antakelse',
    };
  }

  // Extract kjerneantagelse
  const kjerneantagelse = typeof obj.kjerneantagelse === 'string' ? obj.kjerneantagelse : '';

  // Extract neste_steg
  let nesteSteg: string[] = [];
  if (Array.isArray(obj.neste_steg)) {
    nesteSteg = obj.neste_steg
      .filter((s): s is string => typeof s === 'string')
      .slice(0, 3); // Max 3 steps
  }

  // Check completeness
  const isComplete = Boolean(
    kortVurdering &&
    fase.begrunnelse &&
    kjerneantagelse
  );

  return {
    kort_vurdering: kortVurdering,
    fase: {
      status: faseStatus,
      begrunnelse: typeof fase.begrunnelse === 'string' ? fase.begrunnelse : '',
    },
    observasjoner: {
      bruker: observasjoner ? parseObservasjon(observasjoner.bruker) : null,
      brukbarhet: observasjoner ? parseObservasjon(observasjoner.brukbarhet) : null,
      gjennomførbarhet: observasjoner ? parseObservasjon(observasjoner.gjennomførbarhet) : null,
      levedyktighet: observasjoner ? parseObservasjon(observasjoner.levedyktighet) : null,
    },
    kjerneantagelse,
    neste_steg: nesteSteg,
    isComplete,
    parseError: null,
  };
}

/**
 * Parse the full KonseptSpeil result from raw API output
 */
export function parseKonseptSpeilResult(text: string): ParsedKonseptSpeilResult {
  if (!text || text.trim().length === 0) {
    return createEmptyResult();
  }

  // Check if this looks like incomplete streaming data
  if (isIncompleteStreamingJSON(text)) {
    return createEmptyResult();
  }

  try {
    const jsonString = extractJSON(text);

    // Don't try to parse if we didn't get valid JSON content
    if (!jsonString || !jsonString.startsWith('{')) {
      return createEmptyResult();
    }

    const parsed = JSON.parse(jsonString);
    return validateParsedResult(parsed);
  } catch (error) {
    // Only log errors for what appears to be complete but invalid JSON
    const trimmed = text.trim();
    const hasCompleteCodeBlock = /```(?:json)?\s*[\s\S]*```/.test(trimmed);
    const looksComplete = hasCompleteCodeBlock ||
      (trimmed.includes('{') && trimmed.endsWith('}'));

    if (looksComplete) {
      console.error('Failed to parse KonseptSpeil result:', error);
      return createEmptyResult('Kunne ikke tolke svaret fra AI');
    }

    // Incomplete data during streaming - return empty without error
    return createEmptyResult();
  }
}

/**
 * Count non-null observasjoner
 */
export function countObservasjoner(
  observasjoner: ParsedKonseptSpeilResult['observasjoner']
): number {
  return [
    observasjoner.bruker,
    observasjoner.brukbarhet,
    observasjoner.gjennomførbarhet,
    observasjoner.levedyktighet,
  ].filter(Boolean).length;
}
