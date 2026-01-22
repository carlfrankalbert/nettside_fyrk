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
 * Extended set to catch more sophisticated injection techniques
 */
export const SUSPICIOUS_PATTERNS = [
  // Direct instruction override attempts
  /system\s*prompt/i,
  /my\s*instructions/i,
  /ignore\s*(all\s*)?(previous|above|prior)/i,
  /disregard\s*(all\s*)?(previous|above|prior)/i,
  /forget\s*(all\s*)?(previous|above|prior)/i,

  // Role manipulation
  /you\s+are\s+now/i,
  /act\s+as\s+(a|an)\s/i,
  /pretend\s+(to\s+be|you're)/i,
  /roleplay\s+as/i,

  // Instruction injection markers
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<<SYS>>/i,
  /<<\/SYS>>/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,

  // Output manipulation
  /print\s+the\s+(system|original)/i,
  /reveal\s+(your|the)\s+(system|prompt)/i,
  /show\s+me\s+(your|the)\s+(system|prompt)/i,

  // Jailbreak attempts
  /do\s+anything\s+now/i,
  /dan\s+mode/i,
  /developer\s+mode/i,
  /jailbreak/i,

  // Norwegian variations
  /ignorer\s+(alle\s*)?(tidligere|forrige)/i,
  /glem\s+(alle\s*)?(tidligere|forrige)/i,
] as const;

/**
 * Check if output contains suspicious patterns indicating prompt injection
 */
export function containsSuspiciousPatterns(content: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * Escape common XML/HTML entities in input
 * More comprehensive than tag-specific escaping
 */
export function escapeXmlEntities(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Check if input contains potential XML/CDATA injection
 */
export function containsXmlInjection(input: string): boolean {
  return /(<!\[CDATA\[|<!\s*-|<\?xml)/i.test(input);
}
