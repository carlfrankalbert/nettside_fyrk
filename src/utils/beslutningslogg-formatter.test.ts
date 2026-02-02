import { describe, it, expect } from 'vitest';
import {
  formatDateNorwegian,
  parseMultilineInput,
  formatBeslutningsloggMarkdown,
  validateBeslutning,
} from './beslutningslogg-formatter';

describe('formatDateNorwegian', () => {
  it('formats ISO date to Norwegian locale', () => {
    const result = formatDateNorwegian('2026-01-15');
    expect(result).toContain('2026');
    expect(result).toContain('januar');
    expect(result).toContain('15');
  });

  it('returns Invalid Date string for unparseable date', () => {
    // Date constructor doesn't throw — it returns Invalid Date
    const result = formatDateNorwegian('not-a-date');
    expect(result).toBe('Invalid Date');
  });
});

describe('parseMultilineInput', () => {
  it('splits text into non-empty trimmed lines', () => {
    expect(parseMultilineInput('line1\n  line2  \n\nline3')).toEqual([
      'line1',
      'line2',
      'line3',
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(parseMultilineInput('')).toEqual([]);
  });

  it('returns empty array for whitespace-only input', () => {
    expect(parseMultilineInput('  \n  \n  ')).toEqual([]);
  });
});

describe('formatBeslutningsloggMarkdown', () => {
  it('formats minimal data (beslutning + dato only)', () => {
    const md = formatBeslutningsloggMarkdown({
      beslutning: 'Vi velger alternativ A',
      dato: '2026-02-01',
    });

    expect(md).toContain('# Beslutningslogg');
    expect(md).toContain('## Beslutning');
    expect(md).toContain('Vi velger alternativ A');
    expect(md).toContain('## Dato');
    expect(md).not.toContain('## Grunnlag');
    expect(md).not.toContain('## Deltakere');
  });

  it('includes grunnlag section when assumptions exist', () => {
    const md = formatBeslutningsloggMarkdown({
      beslutning: 'Vi velger alternativ A',
      dato: '2026-02-01',
      kritiskeAntakelser: ['Markedet vokser', 'Brukere vil betale'],
    });

    expect(md).toContain('## Grunnlag');
    expect(md).toContain('### Kritiske antakelser');
    expect(md).toContain('- Markedet vokser');
    expect(md).toContain('- Brukere vil betale');
  });

  it('includes akseptert usikkerhet', () => {
    const md = formatBeslutningsloggMarkdown({
      beslutning: 'Vi velger alternativ A',
      dato: '2026-02-01',
      akseptertUsikkerhet: ['Regulering kan endre seg'],
    });

    expect(md).toContain('### Akseptert usikkerhet');
    expect(md).toContain('- Regulering kan endre seg');
  });

  it('includes deltakere when provided', () => {
    const md = formatBeslutningsloggMarkdown({
      beslutning: 'Vi velger alternativ A',
      dato: '2026-02-01',
      deltakere: 'Per, Kari, Ola',
    });

    expect(md).toContain('## Deltakere');
    expect(md).toContain('Per, Kari, Ola');
  });

  it('omits deltakere when empty string', () => {
    const md = formatBeslutningsloggMarkdown({
      beslutning: 'Vi velger alternativ A',
      dato: '2026-02-01',
      deltakere: '   ',
    });

    expect(md).not.toContain('## Deltakere');
  });

  it('trims beslutning whitespace', () => {
    const md = formatBeslutningsloggMarkdown({
      beslutning: '  Vi velger alternativ A  ',
      dato: '2026-02-01',
    });

    expect(md).toContain('Vi velger alternativ A');
    expect(md).not.toContain('  Vi velger');
  });
});

describe('validateBeslutning', () => {
  it('returns null for valid input', () => {
    expect(validateBeslutning('Vi har besluttet å gå videre med plan A')).toBeNull();
  });

  it('returns error for too short input', () => {
    const result = validateBeslutning('Kort');
    expect(result).not.toBeNull();
    expect(result).toContain('minst');
  });

  it('returns error for too long input', () => {
    const result = validateBeslutning('a'.repeat(501));
    expect(result).not.toBeNull();
    expect(result).toContain('lengre');
  });

  it('trims whitespace before validating', () => {
    // 20 chars + whitespace should pass
    expect(validateBeslutning('  ' + 'a'.repeat(20) + '  ')).toBeNull();
  });

  it('returns error for whitespace-only input', () => {
    expect(validateBeslutning('   ')).not.toBeNull();
  });
});
