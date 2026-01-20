import { describe, it, expect } from 'vitest';
import {
  createResponseValidator,
  isKonseptspeilResponseComplete,
  isAntakelseskartResponseComplete,
} from './response-validator';

describe('response-validator', () => {
  describe('createResponseValidator', () => {
    it('should create a validator that returns true for valid responses', () => {
      const validator = createResponseValidator<{ name: string }>(
        (parsed) => !!parsed.name
      );

      expect(validator('{"name": "test"}')).toBe(true);
    });

    it('should return false for empty output', () => {
      const validator = createResponseValidator<{ name: string }>(
        (parsed) => !!parsed.name
      );

      expect(validator('')).toBe(false);
      expect(validator('   ')).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      const validator = createResponseValidator<{ name: string }>(
        (parsed) => !!parsed.name
      );

      expect(validator('not json')).toBe(false);
    });

    it('should return false when validation function returns false', () => {
      const validator = createResponseValidator<{ name: string }>(
        (parsed) => parsed.name === 'expected'
      );

      expect(validator('{"name": "wrong"}')).toBe(false);
    });

    it('should handle JSON in markdown blocks', () => {
      const validator = createResponseValidator<{ value: number }>(
        (parsed) => parsed.value > 0
      );

      expect(validator('```json\n{"value": 42}\n```')).toBe(true);
    });

    it('should handle JSON with surrounding text', () => {
      const validator = createResponseValidator<{ status: string }>(
        (parsed) => parsed.status === 'ok'
      );

      expect(validator('Response: {"status": "ok"} done')).toBe(true);
    });
  });

  describe('isKonseptspeilResponseComplete', () => {
    it('should return true for complete response', () => {
      const response = JSON.stringify({
        refleksjon_status: { kommentar: 'test comment' },
        fokus_sporsmal: { sporsmal: 'test question' },
        dimensjoner: { verdi: { status: 'beskrevet' }, brukbarhet: { status: 'antatt' } },
      });

      expect(isKonseptspeilResponseComplete(response)).toBe(true);
    });

    it('should return false when missing refleksjon_status', () => {
      const response = JSON.stringify({
        fokus_sporsmal: { sporsmal: 'test question' },
        dimensjoner: { verdi: {}, brukbarhet: {} },
      });

      expect(isKonseptspeilResponseComplete(response)).toBe(false);
    });

    it('should return false when refleksjon_status.kommentar is empty', () => {
      const response = JSON.stringify({
        refleksjon_status: { kommentar: '' },
        fokus_sporsmal: { sporsmal: 'test question' },
        dimensjoner: { verdi: {}, brukbarhet: {} },
      });

      expect(isKonseptspeilResponseComplete(response)).toBe(false);
    });

    it('should return false when missing fokus_sporsmal', () => {
      const response = JSON.stringify({
        refleksjon_status: { kommentar: 'test' },
        dimensjoner: { verdi: {}, brukbarhet: {} },
      });

      expect(isKonseptspeilResponseComplete(response)).toBe(false);
    });

    it('should return false when missing dimensjoner.verdi', () => {
      const response = JSON.stringify({
        refleksjon_status: { kommentar: 'test' },
        fokus_sporsmal: { sporsmal: 'question' },
        dimensjoner: { brukbarhet: {} },
      });

      expect(isKonseptspeilResponseComplete(response)).toBe(false);
    });

    it('should return false when missing dimensjoner.brukbarhet', () => {
      const response = JSON.stringify({
        refleksjon_status: { kommentar: 'test' },
        fokus_sporsmal: { sporsmal: 'question' },
        dimensjoner: { verdi: {} },
      });

      expect(isKonseptspeilResponseComplete(response)).toBe(false);
    });

    it('should handle response in markdown block', () => {
      const response = `\`\`\`json
{
  "refleksjon_status": { "kommentar": "test" },
  "fokus_sporsmal": { "sporsmal": "question" },
  "dimensjoner": { "verdi": {}, "brukbarhet": {} }
}
\`\`\``;

      expect(isKonseptspeilResponseComplete(response)).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isKonseptspeilResponseComplete('')).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      expect(isKonseptspeilResponseComplete('not json')).toBe(false);
    });
  });

  describe('isAntakelseskartResponseComplete', () => {
    it('should return true for complete response with målgruppe_behov', () => {
      const response = JSON.stringify({
        beslutning_oppsummert: 'test decision',
        antakelser: {
          målgruppe_behov: [{ id: 'mb1', text: 'assumption' }],
        },
      });

      expect(isAntakelseskartResponseComplete(response)).toBe(true);
    });

    it('should return true for response with løsning_produkt', () => {
      const response = JSON.stringify({
        beslutning_oppsummert: 'test decision',
        antakelser: {
          løsning_produkt: [{ id: 'lp1', text: 'assumption' }],
        },
      });

      expect(isAntakelseskartResponseComplete(response)).toBe(true);
    });

    it('should return true for response with marked_konkurranse', () => {
      const response = JSON.stringify({
        beslutning_oppsummert: 'test decision',
        antakelser: {
          marked_konkurranse: [{ id: 'mk1', text: 'assumption' }],
        },
      });

      expect(isAntakelseskartResponseComplete(response)).toBe(true);
    });

    it('should return true for response with forretning_skalering', () => {
      const response = JSON.stringify({
        beslutning_oppsummert: 'test decision',
        antakelser: {
          forretning_skalering: [{ id: 'fs1', text: 'assumption' }],
        },
      });

      expect(isAntakelseskartResponseComplete(response)).toBe(true);
    });

    it('should return false when missing beslutning_oppsummert', () => {
      const response = JSON.stringify({
        antakelser: {
          målgruppe_behov: [{ id: 'mb1', text: 'assumption' }],
        },
      });

      expect(isAntakelseskartResponseComplete(response)).toBe(false);
    });

    it('should return false when beslutning_oppsummert is empty', () => {
      const response = JSON.stringify({
        beslutning_oppsummert: '',
        antakelser: {
          målgruppe_behov: [{ id: 'mb1', text: 'assumption' }],
        },
      });

      expect(isAntakelseskartResponseComplete(response)).toBe(false);
    });

    it('should return false when missing antakelser', () => {
      const response = JSON.stringify({
        beslutning_oppsummert: 'test decision',
      });

      expect(isAntakelseskartResponseComplete(response)).toBe(false);
    });

    it('should return false when antakelser has no arrays', () => {
      const response = JSON.stringify({
        beslutning_oppsummert: 'test decision',
        antakelser: {},
      });

      expect(isAntakelseskartResponseComplete(response)).toBe(false);
    });

    it('should handle response in markdown block', () => {
      const response = `\`\`\`json
{
  "beslutning_oppsummert": "test decision",
  "antakelser": {
    "målgruppe_behov": [{"id": "mb1", "text": "test"}]
  }
}
\`\`\``;

      expect(isAntakelseskartResponseComplete(response)).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isAntakelseskartResponseComplete('')).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      expect(isAntakelseskartResponseComplete('not json')).toBe(false);
    });
  });
});
