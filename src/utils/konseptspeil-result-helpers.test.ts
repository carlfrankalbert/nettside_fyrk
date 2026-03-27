import { describe, it, expect } from 'vitest';
import { getMostUnclearDimensions, generateFullAnalysisMarkdown, NEXT_STEP_SUGGESTIONS } from './konseptspeil-result-helpers';
import type { Dimensjoner, ParsedKonseptSpeilResultV2 } from '../types/konseptspeil-v2';

// ============================================================================
// Test helpers
// ============================================================================

function makeDimensjoner(overrides: Partial<Record<keyof Dimensjoner, { status: 'beskrevet' | 'antatt' | 'ikke_nevnt' }>>): Dimensjoner {
  const base: Dimensjoner = {
    verdi: { status: 'beskrevet', observasjon: 'God verdi' },
    brukbarhet: { status: 'beskrevet', observasjon: 'Brukbar' },
    gjennomforbarhet: { status: 'beskrevet', observasjon: 'Gjennomf\u00f8rbart' },
    levedyktighet: { status: 'beskrevet', observasjon: 'Levedyktig' },
  };
  for (const [key, val] of Object.entries(overrides)) {
    (base as unknown as Record<string, unknown>)[key] = { ...base[key as keyof Dimensjoner], ...val };
  }
  return base;
}

function makeParsedResult(overrides: Partial<ParsedKonseptSpeilResultV2> = {}): ParsedKonseptSpeilResultV2 {
  return {
    refleksjonStatus: { kommentar: 'Test kommentar', antagelser_funnet: 2 },
    fokusSporsmal: { overskrift: 'Fokus', sporsmal: 'Hva er verdi?', hvorfor: 'Fordi...' },
    dimensjoner: makeDimensjoner({}),
    antagelserListe: ['Antakelse 1', 'Antakelse 2'],
    isComplete: true,
    parseError: null,
    ...overrides,
  };
}

// ============================================================================
// Tests: getMostUnclearDimensions
// ============================================================================

describe('getMostUnclearDimensions', () => {
  it('returns empty array when all dimensions are described', () => {
    const dim = makeDimensjoner({});
    expect(getMostUnclearDimensions(dim)).toEqual([]);
  });

  it('returns single unclear dimension', () => {
    const dim = makeDimensjoner({ verdi: { status: 'antatt' } });
    expect(getMostUnclearDimensions(dim)).toEqual(['verdi']);
  });

  it('returns two dimensions when they share the same status', () => {
    const dim = makeDimensjoner({
      verdi: { status: 'ikke_nevnt' },
      brukbarhet: { status: 'ikke_nevnt' },
    });
    expect(getMostUnclearDimensions(dim)).toEqual(['verdi', 'brukbarhet']);
  });

  it('returns only the worst dimension when statuses differ', () => {
    const dim = makeDimensjoner({
      verdi: { status: 'ikke_nevnt' },
      brukbarhet: { status: 'antatt' },
    });
    expect(getMostUnclearDimensions(dim)).toEqual(['verdi']);
  });

  it('prioritizes ikke_nevnt over antatt', () => {
    const dim = makeDimensjoner({
      gjennomforbarhet: { status: 'ikke_nevnt' },
      levedyktighet: { status: 'antatt' },
    });
    expect(getMostUnclearDimensions(dim)).toEqual(['gjennomforbarhet']);
  });
});

// ============================================================================
// Tests: generateFullAnalysisMarkdown
// ============================================================================

describe('generateFullAnalysisMarkdown', () => {
  it('includes header', () => {
    const md = generateFullAnalysisMarkdown(makeParsedResult());
    expect(md).toContain('# Konseptspeil-analyse');
  });

  it('includes summary when present', () => {
    const md = generateFullAnalysisMarkdown(makeParsedResult());
    expect(md).toContain('## Oppsummering');
    expect(md).toContain('Test kommentar');
  });

  it('includes focus question', () => {
    const md = generateFullAnalysisMarkdown(makeParsedResult());
    expect(md).toContain('## Fokus');
    expect(md).toContain('Hva er verdi?');
    expect(md).toContain('_Fordi..._');
  });

  it('includes all four dimensions', () => {
    const md = generateFullAnalysisMarkdown(makeParsedResult());
    expect(md).toContain('## Dimensjoner');
    expect(md).toContain('### Verdi');
    expect(md).toContain('### Brukbarhet');
    expect(md).toContain('### Gjennomf\u00f8rbarhet');
    expect(md).toContain('### Levedyktighet');
  });

  it('includes assumptions when present', () => {
    const md = generateFullAnalysisMarkdown(makeParsedResult());
    expect(md).toContain('## Antagelser i teksten');
    expect(md).toContain('- Antakelse 1');
    expect(md).toContain('- Antakelse 2');
  });

  it('omits assumptions section when empty', () => {
    const md = generateFullAnalysisMarkdown(makeParsedResult({ antagelserListe: [] }));
    expect(md).not.toContain('## Antagelser i teksten');
  });

  it('ends with FYRK attribution', () => {
    const md = generateFullAnalysisMarkdown(makeParsedResult());
    expect(md).toContain('Generert med Konseptspeilet');
    expect(md).toContain('FYRK');
  });
});

// ============================================================================
// Tests: NEXT_STEP_SUGGESTIONS
// ============================================================================

describe('NEXT_STEP_SUGGESTIONS', () => {
  it('has a suggestion for every dimension key', () => {
    expect(NEXT_STEP_SUGGESTIONS.verdi).toBeDefined();
    expect(NEXT_STEP_SUGGESTIONS.brukbarhet).toBeDefined();
    expect(NEXT_STEP_SUGGESTIONS.gjennomforbarhet).toBeDefined();
    expect(NEXT_STEP_SUGGESTIONS.levedyktighet).toBeDefined();
  });
});
