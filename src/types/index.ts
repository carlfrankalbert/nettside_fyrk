/**
 * Shared TypeScript types and interfaces
 */

// ============================================================================
// Anthropic API Types
// ============================================================================

/**
 * Anthropic API text block response
 */
export interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

/**
 * Anthropic API response structure
 */
export interface AnthropicResponse {
  content: AnthropicTextBlock[];
}

/**
 * Anthropic streaming event structure
 */
export interface AnthropicStreamEvent {
  type: string;
  delta?: {
    type: string;
    text?: string;
  };
}

/**
 * Anthropic API error response
 */
export interface AnthropicErrorResponse {
  error?: {
    message?: string;
  };
}

/**
 * Type guard to validate Anthropic text block structure
 */
export function isAnthropicTextBlock(block: unknown): block is AnthropicTextBlock {
  return (
    typeof block === 'object' &&
    block !== null &&
    (block as AnthropicTextBlock).type === 'text' &&
    typeof (block as AnthropicTextBlock).text === 'string'
  );
}

/**
 * Type guard to validate Anthropic API response structure
 */
export function isValidAnthropicResponse(data: unknown): data is AnthropicResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const response = data as Record<string, unknown>;
  if (!Array.isArray(response.content)) {
    return false;
  }
  // At least one content block should exist
  if (response.content.length === 0) {
    return false;
  }
  // First block should be a valid text block
  return isAnthropicTextBlock(response.content[0]);
}

/**
 * Safely extract text from Anthropic response
 * Returns empty string if response is invalid
 */
export function extractAnthropicText(data: unknown): string {
  if (!isValidAnthropicResponse(data)) {
    return '';
  }
  return data.content[0].text;
}

