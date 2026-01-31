/**
 * Unit tests for antakelseskart-parser
 */
import { describe, it, expect } from 'vitest';
import { parseAntakelseskartResult, hasContent, getAllAssumptions } from './antakelseskart-parser';

const VALID_JSON_RESPONSE = JSON.stringify({
  beslutning_oppsummert: 'Vi satser på nytt SaaS-produkt for SMB-markedet',
  antakelser: {
    målgruppe_behov: [
      { id: 'mb1', text: 'SMB-bedrifter har behov for enklere verktøy', certainty: 'middels', consequence: 'høy', status: 'å_validere' },
      { id: 'mb2', text: 'Brukerne er villige til å betale månedlig', certainty: 'lav', consequence: 'høy', status: 'å_validere' },
    ],
    løsning_produkt: [
      { id: 'lp1', text: 'En web-app er riktig plattform', certainty: 'høy', consequence: 'middels', status: 'validert' },
    ],
    marked_konkurranse: [
      { id: 'mk1', text: 'Ingen direkte konkurrenter i Norge', certainty: 'lav', consequence: 'middels', status: 'å_validere' },
    ],
    forretning_skalering: [
      { id: 'fs1', text: 'Vi kan nå break-even innen 12 måneder', certainty: 'lav', consequence: 'høy', status: 'å_validere' },
    ],
  },
  antall_totalt: 5,
});

describe('parseAntakelseskartResult', () => {
  it('parses a complete valid JSON response', () => {
    const result = parseAntakelseskartResult(VALID_JSON_RESPONSE);

    expect(result.isComplete).toBe(true);
    expect(result.parseError).toBeNull();
    expect(result.beslutningOppsummert).toBe('Vi satser på nytt SaaS-produkt for SMB-markedet');
    expect(result.antallTotalt).toBe(5);
    expect(result.antakelser.målgruppe_behov).toHaveLength(2);
    expect(result.antakelser.løsning_produkt).toHaveLength(1);
    expect(result.antakelser.marked_konkurranse).toHaveLength(1);
    expect(result.antakelser.forretning_skalering).toHaveLength(1);
  });

  it('preserves assumption fields correctly', () => {
    const result = parseAntakelseskartResult(VALID_JSON_RESPONSE);

    const firstAssumption = result.antakelser.målgruppe_behov[0];
    expect(firstAssumption.id).toBe('mb1');
    expect(firstAssumption.text).toBe('SMB-bedrifter har behov for enklere verktøy');
    expect(firstAssumption.category).toBe('målgruppe_behov');
    expect(firstAssumption.certainty).toBe('middels');
    expect(firstAssumption.consequence).toBe('høy');
    expect(firstAssumption.status).toBe('å_validere');
  });

  it('returns empty result for empty string', () => {
    const result = parseAntakelseskartResult('');

    expect(result.isComplete).toBe(false);
    expect(result.beslutningOppsummert).toBe('');
    expect(result.antallTotalt).toBe(0);
    expect(result.antakelser.målgruppe_behov).toHaveLength(0);
  });

  it('returns empty result for whitespace', () => {
    const result = parseAntakelseskartResult('   ');

    expect(result.isComplete).toBe(false);
  });

  it('handles incomplete JSON during streaming', () => {
    const result = parseAntakelseskartResult('{"beslutning_oppsummert": "Vi satser');

    expect(result.isComplete).toBe(false);
    expect(result.parseError).toBeNull();
  });

  it('generates fallback IDs when missing', () => {
    const json = JSON.stringify({
      beslutning_oppsummert: 'Test',
      antakelser: {
        målgruppe_behov: [{ text: 'No ID assumption' }],
        løsning_produkt: [],
        marked_konkurranse: [],
        forretning_skalering: [],
      },
      antall_totalt: 1,
    });

    const result = parseAntakelseskartResult(json);

    expect(result.antakelser.målgruppe_behov[0].id).toBe('må1');
  });

  it('handles response with empty categories', () => {
    const json = JSON.stringify({
      beslutning_oppsummert: 'En beslutning',
      antakelser: {
        målgruppe_behov: [{ id: 'mb1', text: 'Eneste antakelse' }],
        løsning_produkt: [],
        marked_konkurranse: [],
        forretning_skalering: [],
      },
      antall_totalt: 1,
    });

    const result = parseAntakelseskartResult(json);

    expect(result.isComplete).toBe(true);
    expect(result.antallTotalt).toBe(1);
  });

  it('uses calculated total when antall_totalt is missing', () => {
    const json = JSON.stringify({
      beslutning_oppsummert: 'Test',
      antakelser: {
        målgruppe_behov: [{ id: 'mb1', text: 'A' }],
        løsning_produkt: [{ id: 'lp1', text: 'B' }],
        marked_konkurranse: [],
        forretning_skalering: [],
      },
    });

    const result = parseAntakelseskartResult(json);

    expect(result.antallTotalt).toBe(2);
  });

  it('handles non-JSON input gracefully', () => {
    const result = parseAntakelseskartResult('This is not JSON at all');

    expect(result.isComplete).toBe(false);
    expect(result.beslutningOppsummert).toBe('');
  });
});

describe('hasContent', () => {
  it('returns true when beslutningOppsummert is present', () => {
    const result = parseAntakelseskartResult(VALID_JSON_RESPONSE);
    expect(hasContent(result)).toBe(true);
  });

  it('returns false for empty result', () => {
    const result = parseAntakelseskartResult('');
    expect(hasContent(result)).toBe(false);
  });
});

describe('getAllAssumptions', () => {
  it('returns flat array of all assumptions', () => {
    const result = parseAntakelseskartResult(VALID_JSON_RESPONSE);
    const all = getAllAssumptions(result.antakelser);

    expect(all).toHaveLength(5);
    expect(all[0].category).toBe('målgruppe_behov');
    expect(all[2].category).toBe('løsning_produkt');
  });

  it('returns empty array when no assumptions', () => {
    const result = parseAntakelseskartResult('');
    const all = getAllAssumptions(result.antakelser);
    expect(all).toHaveLength(0);
  });
});
