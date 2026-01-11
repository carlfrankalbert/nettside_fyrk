/**
 * Unit tests for konseptspeil-parser-v2
 *
 * Tests the parsing of KonseptSpeil v2 structured output format.
 */
import { describe, it, expect } from 'vitest';
import { parseKonseptSpeilResultV2, hasContentV2, isV2Format } from './konseptspeil-parser-v2';

const VALID_V2_RESPONSE = `---SUMMARY---
assumptions: 4
unclear: 3
maturity: 2
recommendation: Utforsk brukerbehov før du går videre
---END_SUMMARY---

---DIMENSIONS---
value: assumed
value_desc: Problemet er nevnt, men ikke validert med brukere.
usability: not_addressed
usability_desc: Hvordan produktledere vil bruke verktøyet er ikke beskrevet.
feasibility: assumed
feasibility_desc: Teksten antyder at logging og tagging er mulig å bygge.
viability: not_addressed
viability_desc: Forretningsmodell eller ressursbehov er ikke nevnt.
---END_DIMENSIONS---

---ASSUMPTIONS---
- Teksten antyder at produktledere opplever det som utfordrende
- Det kan ligge en antakelse om at logging vil hjelpe
- Det virker som teksten forutsetter at det er tid til å tagge
- Teksten antyder at mønstre er nyttig informasjon
---END_ASSUMPTIONS---

---QUESTIONS---
- Hvordan håndterer produktledere dette i dag?
- Hva skal til for å logge konsekvent?
- Hvilke mønstre er interessante?
- Er tidsbruk på logging verdt innsikten?
- Hva ville skje hvis du lot problemet ligge?
---END_QUESTIONS---`;

describe('parseKonseptSpeilResultV2', () => {
  it('parses a complete valid v2 response', () => {
    const result = parseKonseptSpeilResultV2(VALID_V2_RESPONSE);

    expect(result.isComplete).toBe(true);
    expect(result.parseError).toBeNull();

    // Summary
    expect(result.summary.assumptionCount).toBe(4);
    expect(result.summary.unclearCount).toBe(3);
    expect(result.summary.maturityLevel).toBe(2);
    expect(result.summary.maturityLabel).toBe('Lite utforsket');
    expect(result.summary.recommendation).toBe('Utforsk brukerbehov før du går videre');

    // Dimensions
    expect(result.dimensions).toHaveLength(4);
    expect(result.dimensions[0].type).toBe('value');
    expect(result.dimensions[0].status).toBe('assumed');
    expect(result.dimensions[0].description).toContain('Problemet er nevnt');

    // Assumptions and questions
    expect(result.antagelser).toHaveLength(4);
    expect(result.sporsmal).toHaveLength(5);
  });

  it('handles empty input gracefully', () => {
    const result = parseKonseptSpeilResultV2('');

    expect(result.isComplete).toBe(false);
    expect(result.parseError).toBeNull();
    expect(result.antagelser).toHaveLength(0);
    expect(result.sporsmal).toHaveLength(0);
    expect(result.dimensions).toHaveLength(0);
    expect(result.summary.assumptionCount).toBe(0);
  });

  it('handles whitespace-only input', () => {
    const result = parseKonseptSpeilResultV2('   \n  \n   ');

    expect(result.isComplete).toBe(false);
    expect(result.antagelser).toHaveLength(0);
    expect(result.sporsmal).toHaveLength(0);
  });

  it('parses summary section correctly', () => {
    const input = `---SUMMARY---
assumptions: 5
unclear: 2
maturity: 4
recommendation: Klar for prototype-testing
---END_SUMMARY---

---DIMENSIONS---
value: described
value_desc: Test
usability: described
usability_desc: Test
feasibility: described
feasibility_desc: Test
viability: described
viability_desc: Test
---END_DIMENSIONS---

---ASSUMPTIONS---
- Test assumption
---END_ASSUMPTIONS---

---QUESTIONS---
- Test question?
---END_QUESTIONS---`;

    const result = parseKonseptSpeilResultV2(input);

    expect(result.summary.assumptionCount).toBe(5);
    expect(result.summary.unclearCount).toBe(2);
    expect(result.summary.maturityLevel).toBe(4);
    expect(result.summary.maturityLabel).toBe('Mye beskrevet');
    expect(result.summary.recommendation).toBe('Klar for prototype-testing');
  });

  it('parses all dimension statuses correctly', () => {
    const input = `---SUMMARY---
assumptions: 1
unclear: 1
maturity: 3
recommendation: Test
---END_SUMMARY---

---DIMENSIONS---
value: described
value_desc: Godt beskrevet
usability: assumed
usability_desc: Antas
feasibility: not_addressed
feasibility_desc: Ikke nevnt
viability: described
viability_desc: Utforsket
---END_DIMENSIONS---

---ASSUMPTIONS---
- Test
---END_ASSUMPTIONS---

---QUESTIONS---
- Test?
---END_QUESTIONS---`;

    const result = parseKonseptSpeilResultV2(input);

    expect(result.dimensions[0].status).toBe('described');
    expect(result.dimensions[1].status).toBe('assumed');
    expect(result.dimensions[2].status).toBe('not_addressed');
    expect(result.dimensions[3].status).toBe('described');
  });

  it('clamps maturity level to valid range', () => {
    const inputHigh = `---SUMMARY---
assumptions: 1
unclear: 1
maturity: 10
recommendation: Test
---END_SUMMARY---

---DIMENSIONS---
value: described
value_desc: Test
usability: described
usability_desc: Test
feasibility: described
feasibility_desc: Test
viability: described
viability_desc: Test
---END_DIMENSIONS---

---ASSUMPTIONS---
- Test
---END_ASSUMPTIONS---

---QUESTIONS---
- Test?
---END_QUESTIONS---`;

    const resultHigh = parseKonseptSpeilResultV2(inputHigh);
    expect(resultHigh.summary.maturityLevel).toBe(5);

    const inputLow = inputHigh.replace('maturity: 10', 'maturity: 0');
    const resultLow = parseKonseptSpeilResultV2(inputLow);
    expect(resultLow.summary.maturityLevel).toBe(1);
  });

  it('handles partial response (only summary)', () => {
    const input = `---SUMMARY---
assumptions: 2
unclear: 1
maturity: 2
recommendation: Utforsk mer
---END_SUMMARY---`;

    const result = parseKonseptSpeilResultV2(input);

    expect(result.isComplete).toBe(false);
    expect(result.summary.assumptionCount).toBe(2);
    expect(result.dimensions).toHaveLength(0);
    expect(result.antagelser).toHaveLength(0);
  });

  it('handles Norwegian characters correctly', () => {
    const input = `---SUMMARY---
assumptions: 2
unclear: 1
maturity: 2
recommendation: Æ, ø og å fungerer fint
---END_SUMMARY---

---DIMENSIONS---
value: assumed
value_desc: Støtter løsningen flerspråklighet?
usability: assumed
usability_desc: Test
feasibility: assumed
feasibility_desc: Test
viability: assumed
viability_desc: Test
---END_DIMENSIONS---

---ASSUMPTIONS---
- Æ, ø og å fungerer fint
- Særnorske tegn håndteres
---END_ASSUMPTIONS---

---QUESTIONS---
- Støtter løsningen flerspråklighet?
---END_QUESTIONS---`;

    const result = parseKonseptSpeilResultV2(input);

    expect(result.summary.recommendation).toBe('Æ, ø og å fungerer fint');
    expect(result.antagelser[0]).toBe('Æ, ø og å fungerer fint');
    expect(result.sporsmal[0]).toBe('Støtter løsningen flerspråklighet?');
  });

  it('handles bullet points with asterisks', () => {
    const input = `---SUMMARY---
assumptions: 2
unclear: 1
maturity: 2
recommendation: Test
---END_SUMMARY---

---DIMENSIONS---
value: assumed
value_desc: Test
usability: assumed
usability_desc: Test
feasibility: assumed
feasibility_desc: Test
viability: assumed
viability_desc: Test
---END_DIMENSIONS---

---ASSUMPTIONS---
* Antagelse med asterisk
* Annen antagelse
---END_ASSUMPTIONS---

---QUESTIONS---
* Spørsmål med asterisk?
---END_QUESTIONS---`;

    const result = parseKonseptSpeilResultV2(input);

    expect(result.antagelser).toHaveLength(2);
    expect(result.sporsmal).toHaveLength(1);
    expect(result.antagelser[0]).toBe('Antagelse med asterisk');
  });

  it('ignores empty bullet points', () => {
    const input = `---SUMMARY---
assumptions: 2
unclear: 1
maturity: 2
recommendation: Test
---END_SUMMARY---

---DIMENSIONS---
value: assumed
value_desc: Test
usability: assumed
usability_desc: Test
feasibility: assumed
feasibility_desc: Test
viability: assumed
viability_desc: Test
---END_DIMENSIONS---

---ASSUMPTIONS---
- Gyldig antagelse
-
-
- Annen gyldig antagelse
---END_ASSUMPTIONS---

---QUESTIONS---
- Gyldig spørsmål?
---END_QUESTIONS---`;

    const result = parseKonseptSpeilResultV2(input);

    expect(result.antagelser).toHaveLength(2);
    expect(result.antagelser).toContain('Gyldig antagelse');
    expect(result.antagelser).toContain('Annen gyldig antagelse');
  });
});

describe('hasContentV2', () => {
  it('returns true when there is a recommendation', () => {
    const result = parseKonseptSpeilResultV2(`---SUMMARY---
assumptions: 0
unclear: 0
maturity: 1
recommendation: En anbefaling
---END_SUMMARY---`);

    expect(hasContentV2(result)).toBe(true);
  });

  it('returns true when there are dimensions', () => {
    const result = parseKonseptSpeilResultV2(`---SUMMARY---
assumptions: 0
unclear: 0
maturity: 1
recommendation:
---END_SUMMARY---

---DIMENSIONS---
value: assumed
value_desc: Test
usability: assumed
usability_desc: Test
feasibility: assumed
feasibility_desc: Test
viability: assumed
viability_desc: Test
---END_DIMENSIONS---`);

    expect(hasContentV2(result)).toBe(true);
  });

  it('returns true when there are antagelser', () => {
    const result = parseKonseptSpeilResultV2(`---ASSUMPTIONS---
- En antagelse
---END_ASSUMPTIONS---`);

    expect(hasContentV2(result)).toBe(true);
  });

  it('returns true when there are spørsmål', () => {
    const result = parseKonseptSpeilResultV2(`---QUESTIONS---
- Et spørsmål?
---END_QUESTIONS---`);

    expect(hasContentV2(result)).toBe(true);
  });

  it('returns false when there is no content', () => {
    const result = parseKonseptSpeilResultV2('');

    expect(hasContentV2(result)).toBe(false);
  });
});

describe('isV2Format', () => {
  it('returns true for v2 format with SUMMARY', () => {
    expect(isV2Format('---SUMMARY---\ncontent')).toBe(true);
  });

  it('returns true for v2 format with DIMENSIONS', () => {
    expect(isV2Format('---DIMENSIONS---\ncontent')).toBe(true);
  });

  it('returns false for v1 markdown format', () => {
    expect(isV2Format('## Antagelser i teksten\n- test')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isV2Format('')).toBe(false);
  });
});
