import { describe, it, expect } from 'vitest';
import { extractScore, parseOKRResult, getScoreColor } from './okr-parser';

describe('okr-parser', () => {
  describe('extractScore', () => {
    it('should extract score from "8/10" format', () => {
      expect(extractScore('Score: 8/10')).toBe(8);
      expect(extractScore('Vurdering: 7/10')).toBe(7);
      expect(extractScore('Samlet score 9/10')).toBe(9);
    });

    it('should extract score from "8 av 10" format', () => {
      expect(extractScore('Vurdering: 8 av 10')).toBe(8);
      expect(extractScore('Score 6 av 10')).toBe(6);
    });

    it('should extract score from "score: 8" format', () => {
      expect(extractScore('score: 8')).toBe(8);
      expect(extractScore('Score 7')).toBe(7);
    });

    it('should return null for invalid scores', () => {
      expect(extractScore('no score here')).toBeNull();
      expect(extractScore('score: 15')).toBeNull(); // Out of range
      expect(extractScore('score: 0')).toBeNull(); // Out of range
    });

    it('should return null for empty text', () => {
      expect(extractScore('')).toBeNull();
    });
  });

  describe('parseOKRResult', () => {
    const sampleResult = `## Samlet vurdering
Score: 7/10

OKR-settet har god struktur med klart definerte mål.

## Hva fungerer bra
- Objective er inspirerende og retningsgivende
- KR-ene har konkrete tall
- God sammenheng mellom mål og resultater

## Hva bør forbedres
- KR2 er en aktivitet, ikke et resultat
- Mangler baseline for KR1

## Forslag til forbedret OKR-sett

Objective:
Gjøre onboarding enklere for nye brukere.

Key Results:
1. Øke aktiveringsraten fra 45 % til 70 %
2. Redusere tid til første verdi fra 10 til 3 minutter`;

    it('should extract score from result', () => {
      const parsed = parseOKRResult(sampleResult);
      expect(parsed.score).toBe(7);
    });

    it('should extract strengths as bullet points', () => {
      const parsed = parseOKRResult(sampleResult);
      expect(parsed.strengths).toHaveLength(3);
      expect(parsed.strengths[0]).toContain('Objective er inspirerende');
    });

    it('should extract improvements as bullet points', () => {
      const parsed = parseOKRResult(sampleResult);
      expect(parsed.improvements).toHaveLength(2);
      expect(parsed.improvements[0]).toContain('KR2 er en aktivitet');
    });

    it('should extract suggestion section', () => {
      const parsed = parseOKRResult(sampleResult);
      expect(parsed.suggestion).toContain('Objective:');
      expect(parsed.suggestion).toContain('Key Results:');
    });

    it('should mark complete results as isComplete', () => {
      const parsed = parseOKRResult(sampleResult);
      expect(parsed.isComplete).toBe(true);
    });

    it('should handle empty text', () => {
      const parsed = parseOKRResult('');
      expect(parsed.score).toBeNull();
      expect(parsed.strengths).toHaveLength(0);
      expect(parsed.improvements).toHaveLength(0);
      expect(parsed.suggestion).toBe('');
      expect(parsed.isComplete).toBe(false);
    });

    it('should handle partial results (streaming)', () => {
      const partial = `## Samlet vurdering
Score: 6/10

Bra start, men...`;
      const parsed = parseOKRResult(partial);
      expect(parsed.score).toBe(6);
      expect(parsed.isComplete).toBe(false);
    });
  });

  describe('getScoreColor', () => {
    it('should return success colors for scores >= 8', () => {
      const colors = getScoreColor(8);
      expect(colors.label).toBe('Utmerket');
      expect(colors.text).toContain('success');
    });

    it('should return info colors for scores 6-7', () => {
      const colors = getScoreColor(7);
      expect(colors.label).toBe('God');
      expect(colors.text).toContain('info');
    });

    it('should return warning colors for scores 4-5', () => {
      const colors = getScoreColor(5);
      expect(colors.label).toBe('Middels');
      expect(colors.text).toContain('warning');
    });

    it('should return error colors for scores < 4', () => {
      const colors = getScoreColor(3);
      expect(colors.label).toBe('Trenger arbeid');
      expect(colors.text).toContain('error');
    });
  });
});
