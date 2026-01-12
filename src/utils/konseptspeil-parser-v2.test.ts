/**
 * Unit tests for konseptspeil-parser-v2 (JSON format)
 *
 * Tests the parsing of KonseptSpeil v2 JSON output format.
 */
import { describe, it, expect } from 'vitest';
import { parseKonseptSpeilResultV2, hasContentV2, isV2Format } from './konseptspeil-parser-v2';

const VALID_JSON_RESPONSE = `{
  "refleksjon_status": {
    "kommentar": "Du har beskrevet løsningen detaljert, men problemet den løser er kun antydet.",
    "antagelser_funnet": 4
  },
  "fokus_sporsmal": {
    "overskrift": "HVIS DU VIL UTFORSKE ÉN TING VIDERE",
    "sporsmal": "Hvordan håndterer produktledere dette problemet i dag?",
    "hvorfor": "Problemet er nevnt, men ikke konkretisert."
  },
  "dimensjoner": {
    "verdi": {
      "status": "antatt",
      "observasjon": "Målgruppen er nevnt som 'produktledere', men ikke spesifisert."
    },
    "brukbarhet": {
      "status": "ikke_nevnt",
      "observasjon": "Det er ikke beskrevet hvordan verktøyet vil brukes."
    },
    "gjennomforbarhet": {
      "status": "beskrevet",
      "observasjon": "Teknisk løsning er godt beskrevet med konkrete valg."
    },
    "levedyktighet": {
      "status": "ikke_nevnt",
      "observasjon": "Forretningsmodell er ikke nevnt."
    }
  },
  "antagelser_liste": [
    "Det antas at produktledere opplever dette som utfordrende.",
    "Teksten legger til grunn at logging vil hjelpe.",
    "Det antas at det er tid til å tagge samtaler."
  ]
}`;

describe('parseKonseptSpeilResultV2', () => {
  it('parses a complete valid JSON response', () => {
    const result = parseKonseptSpeilResultV2(VALID_JSON_RESPONSE);

    expect(result.isComplete).toBe(true);
    expect(result.parseError).toBeNull();

    // RefleksjonStatus
    expect(result.refleksjonStatus.kommentar).toContain('beskrevet løsningen detaljert');
    expect(result.refleksjonStatus.antagelser_funnet).toBe(4);

    // FokusSporsmal
    expect(result.fokusSporsmal.overskrift).toBe('HVIS DU VIL UTFORSKE ÉN TING VIDERE');
    expect(result.fokusSporsmal.sporsmal).toContain('produktledere');
    expect(result.fokusSporsmal.hvorfor).toContain('Problemet');

    // Dimensjoner
    expect(result.dimensjoner.verdi.status).toBe('antatt');
    expect(result.dimensjoner.brukbarhet.status).toBe('ikke_nevnt');
    expect(result.dimensjoner.gjennomforbarhet.status).toBe('beskrevet');
    expect(result.dimensjoner.levedyktighet.status).toBe('ikke_nevnt');

    // Antagelser
    expect(result.antagelserListe).toHaveLength(3);
    expect(result.antagelserListe[0]).toContain('Det antas at');
  });

  it('handles empty input', () => {
    const result = parseKonseptSpeilResultV2('');

    expect(result.isComplete).toBe(false);
    expect(result.parseError).toBeNull();
    expect(result.refleksjonStatus.kommentar).toBe('');
    expect(result.antagelserListe).toHaveLength(0);
  });

  it('handles invalid JSON', () => {
    const result = parseKonseptSpeilResultV2('not valid json');

    expect(result.isComplete).toBe(false);
    expect(result.parseError).toBe('Kunne ikke tolke svaret som JSON');
  });

  it('extracts JSON from markdown code block', () => {
    const input = `Here is the response:
\`\`\`json
{
  "refleksjon_status": {
    "kommentar": "Test kommentar",
    "antagelser_funnet": 2
  },
  "fokus_sporsmal": {
    "overskrift": "TEST",
    "sporsmal": "Test spørsmål?",
    "hvorfor": "Test begrunnelse"
  },
  "dimensjoner": {
    "verdi": { "status": "antatt", "observasjon": "Test" },
    "brukbarhet": { "status": "ikke_nevnt", "observasjon": "Test" },
    "gjennomforbarhet": { "status": "beskrevet", "observasjon": "Test" },
    "levedyktighet": { "status": "antatt", "observasjon": "Test" }
  },
  "antagelser_liste": ["Test antagelse"]
}
\`\`\``;

    const result = parseKonseptSpeilResultV2(input);

    expect(result.parseError).toBeNull();
    expect(result.refleksjonStatus.kommentar).toBe('Test kommentar');
    expect(result.fokusSporsmal.sporsmal).toBe('Test spørsmål?');
  });

  it('normalizes dimension status values', () => {
    const input = `{
      "refleksjon_status": { "kommentar": "Test", "antagelser_funnet": 0 },
      "fokus_sporsmal": { "overskrift": "Test", "sporsmal": "Test?", "hvorfor": "Test" },
      "dimensjoner": {
        "verdi": { "status": "BESKREVET", "observasjon": "Test" },
        "brukbarhet": { "status": "Antatt", "observasjon": "Test" },
        "gjennomforbarhet": { "status": "IKKE_NEVNT", "observasjon": "Test" },
        "levedyktighet": { "status": "invalid", "observasjon": "Test" }
      },
      "antagelser_liste": []
    }`;

    const result = parseKonseptSpeilResultV2(input);

    expect(result.dimensjoner.verdi.status).toBe('beskrevet');
    expect(result.dimensjoner.brukbarhet.status).toBe('antatt');
    expect(result.dimensjoner.gjennomforbarhet.status).toBe('ikke_nevnt');
    expect(result.dimensjoner.levedyktighet.status).toBe('ikke_nevnt'); // fallback for invalid
  });

  it('handles partial response with missing fields', () => {
    const input = `{
      "refleksjon_status": {
        "kommentar": "Partial response"
      },
      "fokus_sporsmal": {
        "sporsmal": "Test?"
      },
      "dimensjoner": {}
    }`;

    const result = parseKonseptSpeilResultV2(input);

    expect(result.refleksjonStatus.kommentar).toBe('Partial response');
    expect(result.refleksjonStatus.antagelser_funnet).toBe(0);
    expect(result.fokusSporsmal.sporsmal).toBe('Test?');
    expect(result.fokusSporsmal.overskrift).toBe('HVIS DU VIL UTFORSKE ÉN TING VIDERE');
    expect(result.dimensjoner.verdi.status).toBe('ikke_nevnt');
    expect(result.antagelserListe).toHaveLength(0);
  });

  it('handles Norwegian characters correctly', () => {
    const input = `{
      "refleksjon_status": {
        "kommentar": "Æ, ø og å fungerer fint.",
        "antagelser_funnet": 1
      },
      "fokus_sporsmal": {
        "overskrift": "UTFORSK",
        "sporsmal": "Støtter løsningen særnorske tegn?",
        "hvorfor": "Språkstøtte er viktig."
      },
      "dimensjoner": {
        "verdi": { "status": "beskrevet", "observasjon": "Løsningen støtter flerspråklighet." },
        "brukbarhet": { "status": "antatt", "observasjon": "Test" },
        "gjennomforbarhet": { "status": "antatt", "observasjon": "Test" },
        "levedyktighet": { "status": "antatt", "observasjon": "Test" }
      },
      "antagelser_liste": ["Det antas at æ, ø og å håndteres korrekt."]
    }`;

    const result = parseKonseptSpeilResultV2(input);

    expect(result.refleksjonStatus.kommentar).toBe('Æ, ø og å fungerer fint.');
    expect(result.antagelserListe[0]).toContain('æ, ø og å');
  });

  it('filters non-string items from antagelser_liste', () => {
    const input = `{
      "refleksjon_status": { "kommentar": "Test", "antagelser_funnet": 2 },
      "fokus_sporsmal": { "overskrift": "Test", "sporsmal": "Test?", "hvorfor": "Test" },
      "dimensjoner": {
        "verdi": { "status": "antatt", "observasjon": "Test" },
        "brukbarhet": { "status": "antatt", "observasjon": "Test" },
        "gjennomforbarhet": { "status": "antatt", "observasjon": "Test" },
        "levedyktighet": { "status": "antatt", "observasjon": "Test" }
      },
      "antagelser_liste": ["Valid string", 123, null, "Another valid string", {}]
    }`;

    const result = parseKonseptSpeilResultV2(input);

    expect(result.antagelserListe).toHaveLength(2);
    expect(result.antagelserListe[0]).toBe('Valid string');
    expect(result.antagelserListe[1]).toBe('Another valid string');
  });
});

describe('hasContentV2', () => {
  it('returns true when there is a kommentar', () => {
    const result = parseKonseptSpeilResultV2(`{
      "refleksjon_status": { "kommentar": "Some content", "antagelser_funnet": 0 },
      "fokus_sporsmal": { "overskrift": "", "sporsmal": "", "hvorfor": "" },
      "dimensjoner": {
        "verdi": { "status": "ikke_nevnt", "observasjon": "" },
        "brukbarhet": { "status": "ikke_nevnt", "observasjon": "" },
        "gjennomforbarhet": { "status": "ikke_nevnt", "observasjon": "" },
        "levedyktighet": { "status": "ikke_nevnt", "observasjon": "" }
      },
      "antagelser_liste": []
    }`);

    expect(hasContentV2(result)).toBe(true);
  });

  it('returns true when there is a sporsmal', () => {
    const result = parseKonseptSpeilResultV2(`{
      "refleksjon_status": { "kommentar": "", "antagelser_funnet": 0 },
      "fokus_sporsmal": { "overskrift": "", "sporsmal": "A question?", "hvorfor": "" },
      "dimensjoner": {
        "verdi": { "status": "ikke_nevnt", "observasjon": "" },
        "brukbarhet": { "status": "ikke_nevnt", "observasjon": "" },
        "gjennomforbarhet": { "status": "ikke_nevnt", "observasjon": "" },
        "levedyktighet": { "status": "ikke_nevnt", "observasjon": "" }
      },
      "antagelser_liste": []
    }`);

    expect(hasContentV2(result)).toBe(true);
  });

  it('returns true when there are antagelser', () => {
    const result = parseKonseptSpeilResultV2(`{
      "refleksjon_status": { "kommentar": "", "antagelser_funnet": 1 },
      "fokus_sporsmal": { "overskrift": "", "sporsmal": "", "hvorfor": "" },
      "dimensjoner": {
        "verdi": { "status": "ikke_nevnt", "observasjon": "" },
        "brukbarhet": { "status": "ikke_nevnt", "observasjon": "" },
        "gjennomforbarhet": { "status": "ikke_nevnt", "observasjon": "" },
        "levedyktighet": { "status": "ikke_nevnt", "observasjon": "" }
      },
      "antagelser_liste": ["An assumption"]
    }`);

    expect(hasContentV2(result)).toBe(true);
  });

  it('returns false when there is no content', () => {
    const result = parseKonseptSpeilResultV2('');

    expect(hasContentV2(result)).toBe(false);
  });
});

describe('isV2Format', () => {
  it('returns true for JSON starting with {', () => {
    expect(isV2Format('{ "refleksjon_status": {} }')).toBe(true);
  });

  it('returns true for text containing refleksjon_status', () => {
    expect(isV2Format('Some text "refleksjon_status" more text')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isV2Format('')).toBe(false);
  });

  it('returns false for old format', () => {
    expect(isV2Format('---SUMMARY---\ncontent')).toBe(false);
  });
});
