import { describe, it, expect } from 'vitest';
import { parsePreMortemSections, parseInlineBold } from './pre-mortem-parser';

// ============================================================================
// Tests: parsePreMortemSections
// ============================================================================

describe('parsePreMortemSections', () => {
  it('parses numbered bold sections', () => {
    const input = '**1. Beslutning** Vi beslutter X\n\n**2. Ramme** Innenfor Q2';
    const sections = parsePreMortemSections(input);
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe('1. Beslutning');
    expect(sections[0].content).toContain('Vi beslutter X');
    expect(sections[1].title).toBe('2. Ramme');
    expect(sections[1].content).toContain('Innenfor Q2');
  });

  it('returns empty array for content without sections', () => {
    const input = 'Just some plain text without any sections.';
    expect(parsePreMortemSections(input)).toEqual([]);
  });

  it('handles single section', () => {
    const input = '**1. Pre-Mortem** Hva kan g\u00e5 galt?';
    const sections = parsePreMortemSections(input);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('1. Pre-Mortem');
  });

  it('preserves content between sections', () => {
    const input = '**1. A** Content A\n\nExtra line\n\n**2. B** Content B';
    const sections = parsePreMortemSections(input);
    expect(sections[0].content).toContain('Content A');
    expect(sections[0].content).toContain('Extra line');
  });

  it('handles multi-digit section numbers', () => {
    const input = '**10. Eierskap** Ansvarlig: Team X';
    const sections = parsePreMortemSections(input);
    expect(sections[0].title).toBe('10. Eierskap');
  });
});

// ============================================================================
// Tests: parseInlineBold
// ============================================================================

describe('parseInlineBold', () => {
  it('returns plain text as-is when no bold markers', () => {
    const result = parseInlineBold('Just plain text');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Just plain text');
  });

  it('parses single bold segment', () => {
    const result = parseInlineBold('This is **bold** text');
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('This is ');
    // Middle element is a React element (strong)
    expect(result[2]).toBe(' text');
  });

  it('handles multiple bold segments', () => {
    const result = parseInlineBold('**A** and **B**');
    // Should have: strong(A), " and ", strong(B)
    expect(result).toHaveLength(3);
  });

  it('handles empty string', () => {
    const result = parseInlineBold('');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('');
  });

  it('handles bold at start', () => {
    const result = parseInlineBold('**Start** of text');
    expect(result).toHaveLength(2);
    expect(result[1]).toBe(' of text');
  });

  it('handles bold at end', () => {
    const result = parseInlineBold('Text at **end**');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('Text at ');
  });
});
