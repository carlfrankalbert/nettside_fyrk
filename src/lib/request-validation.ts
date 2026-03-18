/**
 * Request body validation for AI tool handlers
 */

/**
 * Expected request body shape
 */
export interface AIToolRequestBody {
  input?: string;
  stream?: boolean;
}

/**
 * Type guard to validate request body structure
 */
export function isValidRequestBody(body: unknown): body is AIToolRequestBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const obj = body as Record<string, unknown>;
  // input must be undefined or string
  if (obj.input !== undefined && typeof obj.input !== 'string') {
    return false;
  }
  // stream must be undefined or boolean
  if (obj.stream !== undefined && typeof obj.stream !== 'boolean') {
    return false;
  }
  return true;
}
