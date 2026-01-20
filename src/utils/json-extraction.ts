/**
 * Shared JSON extraction utilities for parsing AI responses.
 * Consolidates duplicated extraction logic from parsers.
 */

/**
 * Extracts JSON from text that may contain markdown code blocks or raw JSON.
 *
 * Handles these formats:
 * 1. JSON wrapped in ```json ... ``` or ``` ... ```
 * 2. Raw JSON object starting with { and ending with }
 * 3. Plain text (returned as-is for further processing)
 *
 * @param text - The raw text potentially containing JSON
 * @returns The extracted JSON string, or the trimmed input if no JSON found
 */
export function extractJson(text: string): string {
  const trimmed = text.trim();

  // Try to extract JSON from markdown code block
  const jsonBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Try to find JSON object boundaries (handles text before/after JSON)
  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    return trimmed.substring(jsonStart, jsonEnd + 1);
  }

  // Return trimmed text as fallback
  return trimmed;
}

/**
 * Safely parses JSON with error handling.
 * Returns null if parsing fails instead of throwing.
 *
 * @param jsonString - The JSON string to parse
 * @returns Parsed object or null if invalid
 */
export function safeJsonParse<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * Extracts and parses JSON from text in a single operation.
 * Combines extractJson and safeJsonParse for convenience.
 *
 * @param text - The raw text potentially containing JSON
 * @returns Parsed object or null if extraction/parsing fails
 */
export function extractAndParseJson<T>(text: string): T | null {
  const jsonString = extractJson(text);
  return safeJsonParse<T>(jsonString);
}
