/**
 * Unit tests for konseptspeil-parser
 *
 * Tests the parsing of KonseptSpeil MVP markdown output into structured data.
 */
import { describe, it, expect } from 'vitest';
import { parseKonseptSpeilResult, hasContent } from './konseptspeil-parser';

describe('parseKonseptSpeilResult', () => {
  it('parses a complete valid response with both sections', () => {
    const input = `## Antagelser i teksten

- Brukerne ønsker enklere pålogging
- Markedet er klart for produktet
- Teamet har kapasitet til lansering

## Åpne spørsmål teksten reiser

- Hvem er den primære målgruppen?
- Hva skiller produktet fra konkurrentene?
- Hvordan måles suksess?`;

    const result = parseKonseptSpeilResult(input);

    expect(result.isComplete).toBe(true);
    expect(result.parseError).toBeNull();
    expect(result.antagelser).toHaveLength(3);
    expect(result.sporsmal).toHaveLength(3);
    expect(result.antagelser[0]).toBe('Brukerne ønsker enklere pålogging');
    expect(result.sporsmal[0]).toBe('Hvem er den primære målgruppen?');
  });

  it('handles empty input gracefully', () => {
    const result = parseKonseptSpeilResult('');

    expect(result.isComplete).toBe(false);
    expect(result.parseError).toBeNull();
    expect(result.antagelser).toHaveLength(0);
    expect(result.sporsmal).toHaveLength(0);
  });

  it('handles whitespace-only input', () => {
    const result = parseKonseptSpeilResult('   \n  \n   ');

    expect(result.isComplete).toBe(false);
    expect(result.antagelser).toHaveLength(0);
    expect(result.sporsmal).toHaveLength(0);
  });

  it('handles response with only antagelser section', () => {
    const input = `## Antagelser i teksten

- Første antagelse
- Andre antagelse`;

    const result = parseKonseptSpeilResult(input);

    expect(result.isComplete).toBe(false);
    expect(result.antagelser).toHaveLength(2);
    expect(result.sporsmal).toHaveLength(0);
  });

  it('handles response with only spørsmål section', () => {
    const input = `## Åpne spørsmål teksten reiser

- Første spørsmål?
- Andre spørsmål?`;

    const result = parseKonseptSpeilResult(input);

    expect(result.isComplete).toBe(false);
    expect(result.antagelser).toHaveLength(0);
    expect(result.sporsmal).toHaveLength(2);
  });

  it('handles alternative heading format without "teksten reiser"', () => {
    const input = `## Antagelser i teksten

- En antagelse

## Åpne spørsmål

- Et spørsmål?`;

    const result = parseKonseptSpeilResult(input);

    expect(result.isComplete).toBe(true);
    expect(result.antagelser).toHaveLength(1);
    expect(result.sporsmal).toHaveLength(1);
  });

  it('handles bullet points with asterisks', () => {
    const input = `## Antagelser i teksten

* Antagelse med asterisk
* Annen antagelse

## Åpne spørsmål

* Spørsmål med asterisk?`;

    const result = parseKonseptSpeilResult(input);

    expect(result.isComplete).toBe(true);
    expect(result.antagelser).toHaveLength(2);
    expect(result.sporsmal).toHaveLength(1);
    expect(result.antagelser[0]).toBe('Antagelse med asterisk');
  });

  it('ignores empty bullet points', () => {
    const input = `## Antagelser i teksten

- Gyldig antagelse
-
-
- Annen gyldig antagelse

## Åpne spørsmål

- Gyldig spørsmål?`;

    const result = parseKonseptSpeilResult(input);

    expect(result.antagelser).toHaveLength(2);
    expect(result.antagelser).toContain('Gyldig antagelse');
    expect(result.antagelser).toContain('Annen gyldig antagelse');
  });

  it('handles extra whitespace in content', () => {
    const input = `## Antagelser i teksten

-    Antagelse med ekstra mellomrom

## Åpne spørsmål

-   Spørsmål med mellomrom?   `;

    const result = parseKonseptSpeilResult(input);

    expect(result.antagelser[0]).toBe('Antagelse med ekstra mellomrom');
    expect(result.sporsmal[0]).toBe('Spørsmål med mellomrom?');
  });

  it('handles Norwegian characters correctly', () => {
    const input = `## Antagelser i teksten

- Æ, ø og å fungerer fint
- Særnorske tegn som "ñ" håndteres

## Åpne spørsmål

- Støtter løsningen flerspråklighet?`;

    const result = parseKonseptSpeilResult(input);

    expect(result.antagelser[0]).toBe('Æ, ø og å fungerer fint');
    expect(result.sporsmal[0]).toBe('Støtter løsningen flerspråklighet?');
  });

  it('handles case-insensitive section headers', () => {
    const input = `## ANTAGELSER I TEKSTEN

- En antagelse

## ÅPNE SPØRSMÅL TEKSTEN REISER

- Et spørsmål?`;

    const result = parseKonseptSpeilResult(input);

    expect(result.isComplete).toBe(true);
    expect(result.antagelser).toHaveLength(1);
    expect(result.sporsmal).toHaveLength(1);
  });
});

describe('hasContent', () => {
  it('returns true when there are antagelser', () => {
    const result = {
      antagelser: ['En antagelse'],
      sporsmal: [],
      isComplete: false,
      parseError: null,
    };

    expect(hasContent(result)).toBe(true);
  });

  it('returns true when there are spørsmål', () => {
    const result = {
      antagelser: [],
      sporsmal: ['Et spørsmål?'],
      isComplete: false,
      parseError: null,
    };

    expect(hasContent(result)).toBe(true);
  });

  it('returns false when both arrays are empty', () => {
    const result = {
      antagelser: [],
      sporsmal: [],
      isComplete: false,
      parseError: null,
    };

    expect(hasContent(result)).toBe(false);
  });

  it('returns true when both arrays have content', () => {
    const result = {
      antagelser: ['En antagelse'],
      sporsmal: ['Et spørsmål?'],
      isComplete: true,
      parseError: null,
    };

    expect(hasContent(result)).toBe(true);
  });
});
