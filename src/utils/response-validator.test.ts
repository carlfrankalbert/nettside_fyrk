import { describe, it, expect } from 'vitest';
import {
  createResponseValidator,
  isKonseptspeilResponseComplete,
  isAntakelseskartResponseComplete,
  isPreMortemResponseComplete,
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

  describe('isPreMortemResponseComplete', () => {
    const COMPLETE_RESPONSE = `
**1. BESLUTNING**
Vi vurderer å bytte til cloud-basert infrastruktur.

**2. RAMME OG AVGRENSNING**
- Kontekstuell ramme
- Locks: teknisk / organisatorisk

**3. PRE-MORTEM**
"Det er om 12 måneder. Beslutningen har feilet. Hva skjedde?"
- Mest kritisk: Migreringsprosjektet tok dobbelt så lang tid

**4. TIDLIGE INDIKATORER**
Top 3 målbare signaler

**5. STOPP-KRITERIER**
- PAUSE: Evaluering nødvendig
- FULL TILBAKETREKKING: Avbryt

**6. REALISTISKE KONTROLLER/TILTAK**
Top 3 tiltak

**7. EIERSKAP OG ANSVAR**
- Beslutningseier: CTO

**8. HVA KJENNETEGNER EN GOD BESLUTNING HER?**
- Bullet 1
- Bullet 2
`;

    it('should return true for complete response with all sections', () => {
      expect(isPreMortemResponseComplete(COMPLETE_RESPONSE)).toBe(true);
    });

    it('should return true for response with 4+ key sections', () => {
      const partialResponse = `
**1. BESLUTNING**
Vi vurderer å bytte fra on-premise til cloud-basert infrastruktur for alle kundedatabaser.

**3. PRE-MORTEM**
"Det er om 12 måneder. Beslutningen har feilet. Hva skjedde?"
Migreringsprosjektet tok dobbelt så lang tid som planlagt.

**4. TIDLIGE INDIKATORER**
Top 3 målbare signaler som indikerer at noe går galt.

**7. EIERSKAP OG ANSVAR**
- Beslutningseier: CTO
- Risikooppfølging: IT-sjef
`;
      expect(isPreMortemResponseComplete(partialResponse)).toBe(true);
    });

    it('should return false for response with fewer than 4 sections', () => {
      const incompleteResponse = `
**1. BESLUTNING**
Test beslutning

**3. PRE-MORTEM**
Test pre-mortem
`;
      expect(isPreMortemResponseComplete(incompleteResponse)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isPreMortemResponseComplete('')).toBe(false);
    });

    it('should return false for short response under 200 characters', () => {
      expect(isPreMortemResponseComplete('**1. BESLUTNING** kort')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(isPreMortemResponseComplete('   \n\n   ')).toBe(false);
    });

    it('should be case-insensitive for section detection', () => {
      const mixedCaseResponse = `
**1. BESLUTNING**
Test content that is long enough to pass the minimum length requirement.

**3. Pre-Mortem**
More test content here.

**4. TIDLIGE INDIKATORER**
Even more content.

**7. Eierskap og Ansvar**
Final section content.

Additional text to ensure we meet the 200 character minimum for validation.
`;
      expect(isPreMortemResponseComplete(mixedCaseResponse)).toBe(true);
    });

    it('should detect "stopp" section', () => {
      const withStopp = `
**1. BESLUTNING**
Test content that is long enough to pass validation requirements.

**5. STOPP-KRITERIER**
Test stopp criteria content here.

**3. PRE-MORTEM**
Pre-mortem analysis content.

**8. GOD BESLUTNING**
What characterizes a good decision.

More padding text to ensure we reach the minimum character count.
`;
      expect(isPreMortemResponseComplete(withStopp)).toBe(true);
    });

    it('should detect "god beslutning" section', () => {
      const withGodBeslutning = `
**1. BESLUTNING**
Test beslutning content here that is sufficiently long.

**3. PRE-MORTEM**
Pre-mortem section content.

**4. INDIKATORER**
Indicator content here.

**8. HVA KJENNETEGNER EN GOD BESLUTNING HER?**
What makes this a good decision.

Extra padding for character count.
`;
      expect(isPreMortemResponseComplete(withGodBeslutning)).toBe(true);
    });
  });
});
