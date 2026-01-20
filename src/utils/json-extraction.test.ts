import { describe, it, expect } from 'vitest';
import { extractJson, safeJsonParse, extractAndParseJson } from './json-extraction';

describe('json-extraction', () => {
  describe('extractJson', () => {
    it('should extract JSON from markdown code block with json tag', () => {
      const input = '```json\n{"key": "value"}\n```';
      expect(extractJson(input)).toBe('{"key": "value"}');
    });

    it('should extract JSON from markdown code block without json tag', () => {
      const input = '```\n{"key": "value"}\n```';
      expect(extractJson(input)).toBe('{"key": "value"}');
    });

    it('should extract JSON from text with surrounding content', () => {
      const input = 'Here is the response: {"key": "value"} end of response';
      expect(extractJson(input)).toBe('{"key": "value"}');
    });

    it('should handle raw JSON object', () => {
      const input = '{"key": "value"}';
      expect(extractJson(input)).toBe('{"key": "value"}');
    });

    it('should handle nested JSON objects', () => {
      const input = '{"outer": {"inner": "value"}}';
      expect(extractJson(input)).toBe('{"outer": {"inner": "value"}}');
    });

    it('should handle JSON with arrays', () => {
      const input = '{"items": [1, 2, 3]}';
      expect(extractJson(input)).toBe('{"items": [1, 2, 3]}');
    });

    it('should trim whitespace', () => {
      const input = '  \n  {"key": "value"}  \n  ';
      expect(extractJson(input)).toBe('{"key": "value"}');
    });

    it('should return trimmed text when no JSON found', () => {
      const input = '  plain text  ';
      expect(extractJson(input)).toBe('plain text');
    });

    it('should handle empty string', () => {
      expect(extractJson('')).toBe('');
    });

    it('should handle markdown block with extra whitespace', () => {
      const input = '```json\n  {"key": "value"}  \n```';
      expect(extractJson(input)).toBe('{"key": "value"}');
    });

    it('should handle complex nested structure', () => {
      const input = `
        \`\`\`json
        {
          "refleksjon_status": {
            "kommentar": "test"
          },
          "dimensjoner": {
            "verdi": { "status": "beskrevet" }
          }
        }
        \`\`\`
      `;
      const result = extractJson(input);
      expect(result).toContain('"refleksjon_status"');
      expect(result).toContain('"dimensjoner"');
    });

    it('should prefer markdown block over raw JSON detection', () => {
      const input = '```json\n{"inside": true}\n```\n{"outside": true}';
      expect(extractJson(input)).toBe('{"inside": true}');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse<{ key: string }>('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for invalid JSON', () => {
      expect(safeJsonParse('not json')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(safeJsonParse('')).toBeNull();
    });

    it('should return null for malformed JSON', () => {
      expect(safeJsonParse('{"key": "value"')).toBeNull();
    });

    it('should handle arrays', () => {
      const result = safeJsonParse<number[]>('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle null JSON value', () => {
      expect(safeJsonParse('null')).toBeNull();
    });

    it('should handle nested objects', () => {
      const result = safeJsonParse<{ a: { b: number } }>('{"a": {"b": 1}}');
      expect(result).toEqual({ a: { b: 1 } });
    });

    it('should preserve types', () => {
      const result = safeJsonParse<{ num: number; str: string; bool: boolean }>(
        '{"num": 42, "str": "hello", "bool": true}'
      );
      expect(result).toEqual({ num: 42, str: 'hello', bool: true });
    });
  });

  describe('extractAndParseJson', () => {
    it('should extract and parse JSON from markdown block', () => {
      const input = '```json\n{"key": "value"}\n```';
      const result = extractAndParseJson<{ key: string }>(input);
      expect(result).toEqual({ key: 'value' });
    });

    it('should extract and parse JSON from text with surrounding content', () => {
      const input = 'Response: {"key": "value"} done';
      const result = extractAndParseJson<{ key: string }>(input);
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for text without valid JSON', () => {
      const result = extractAndParseJson('no json here');
      expect(result).toBeNull();
    });

    it('should return null for incomplete JSON in markdown', () => {
      const input = '```json\n{"key": "val\n```';
      expect(extractAndParseJson(input)).toBeNull();
    });

    it('should handle complex AI response format', () => {
      const input = `Here is my analysis:

\`\`\`json
{
  "beslutning_oppsummert": "Test decision",
  "antakelser": {
    "målgruppe_behov": [{"id": "mb1", "text": "assumption"}]
  }
}
\`\`\`

I hope this helps!`;

      const result = extractAndParseJson<{
        beslutning_oppsummert: string;
        antakelser: { målgruppe_behov: Array<{ id: string; text: string }> };
      }>(input);

      expect(result?.beslutning_oppsummert).toBe('Test decision');
      expect(result?.antakelser.målgruppe_behov).toHaveLength(1);
    });
  });
});
