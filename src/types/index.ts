/**
 * Shared TypeScript types and interfaces
 */

// ============================================================================
// Navigation Types
// ============================================================================

export interface NavItem {
  href: string;
  label: string;
  isPrimary?: boolean;
}

// ============================================================================
// SEO Types
// ============================================================================

export interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  canonicalUrl?: URL;
}

// ============================================================================
// Form Types
// ============================================================================

export interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  required?: boolean;
  autocomplete?: string;
  helpText?: string;
  rows?: number;
  placeholder?: string;
}

// ============================================================================
// OKR API Types
// ============================================================================

/**
 * Successful OKR review response
 */
export interface OKRReviewResponse {
  success: true;
  output: string;
  cached?: boolean;
}

/**
 * Failed OKR review response
 */
export interface OKRReviewError {
  success: false;
  error: string;
}

/**
 * Union type for OKR review result
 */
export type OKRReviewResult = OKRReviewResponse | OKRReviewError;

/**
 * OKR API request body
 */
export interface OKRReviewRequest {
  input: string;
  stream?: boolean;
}

/**
 * OKR API success response (server format)
 */
export interface OKRAPISuccessResponse {
  output: string;
  cached: boolean;
}

/**
 * OKR API error response (server format)
 */
export interface OKRAPIErrorResponse {
  error: string;
  details?: string;
}

/**
 * SSE event for streaming OKR review
 */
export interface OKRStreamEvent {
  text?: string;
  error?: boolean;
  message?: string;
}

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

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for bullet point list items
 */
export interface BulletPointProps {
  text: string;
}

/**
 * Props for competency/service cards
 */
export interface CompetencyCardProps {
  title: string;
  description: string;
  icon: string;
}

/**
 * Props for tool cards
 */
export interface ToolCardProps {
  title: string;
  description: string;
  href: string;
  buttonText: string;
  icon?: string;
}
