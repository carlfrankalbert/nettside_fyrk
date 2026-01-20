/**
 * Input Sanitization Utilities
 *
 * Provides sanitization functions to prevent XML delimiter breakout attacks
 * in AI prompts. Each tool has specific XML wrapper tags that need protection.
 *
 * Used by: okr-sjekken, konseptspeilet, antakelseskart
 */

/**
 * Generic sanitizer that escapes specific XML tags to prevent breakout
 */
function sanitizeXmlTag(input: string, tagName: string): string {
  const openingTagRegex = new RegExp(`<${tagName}>`, 'gi');
  const closingTagRegex = new RegExp(`</${tagName}>`, 'gi');

  return input
    .replace(closingTagRegex, `&lt;/${tagName}&gt;`)
    .replace(openingTagRegex, `&lt;${tagName}&gt;`);
}

/**
 * Sanitize input for konseptspeilet (uses <konsept_input> wrapper)
 */
export function sanitizeKonseptInput(input: string): string {
  return sanitizeXmlTag(input, 'konsept_input');
}

/**
 * Sanitize input for antakelseskart (uses <beslutning_input> wrapper)
 */
export function sanitizeBeslutningInput(input: string): string {
  return sanitizeXmlTag(input, 'beslutning_input');
}

/**
 * Sanitize input for OKR-sjekken (uses <okr_input> wrapper)
 */
export function sanitizeOkrInput(input: string): string {
  return sanitizeXmlTag(input, 'okr_input');
}

/**
 * Sanitize input for Pre-Mortem Brief (uses <premortem_input> wrapper)
 */
export function sanitizePreMortemInput(input: string): string {
  return sanitizeXmlTag(input, 'premortem_input');
}

/**
 * Create a user message wrapped in XML tags for prompt injection protection
 */
export function createWrappedUserMessage(
  input: string,
  tagName: string,
  instruction: string
): string {
  const sanitized = sanitizeXmlTag(input.trim(), tagName);
  return `<${tagName}>
${sanitized}
</${tagName}>

${instruction}`;
}

/**
 * Suspicious patterns that may indicate prompt injection attempts
 */
export const SUSPICIOUS_PATTERNS = [
  /system\s*prompt/i,
  /my\s*instructions/i,
  /ignore\s*previous/i,
] as const;

/**
 * Check if output contains suspicious patterns indicating prompt injection
 */
export function containsSuspiciousPatterns(content: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(content));
}
