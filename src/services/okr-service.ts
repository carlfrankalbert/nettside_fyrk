/**
 * OKR Reviewer Service
 * Handles API communication for OKR analysis
 */

export interface OKRReviewResponse {
  success: true;
  output: string;
}

export interface OKRReviewError {
  success: false;
  error: string;
}

export type OKRReviewResult = OKRReviewResponse | OKRReviewError;

const DEFAULT_ERROR_MESSAGE = 'Noe gikk galt under vurderingen. Prøv igjen om litt.';

/**
 * Submit an OKR for AI-powered review
 */
export async function reviewOKR(input: string): Promise<OKRReviewResult> {
  try {
    const response = await fetch('/api/okr-reviewer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: DEFAULT_ERROR_MESSAGE,
      };
    }

    const data = await response.json();

    if (!data.output) {
      return {
        success: false,
        error: DEFAULT_ERROR_MESSAGE,
      };
    }

    return {
      success: true,
      output: data.output,
    };
  } catch {
    return {
      success: false,
      error: DEFAULT_ERROR_MESSAGE,
    };
  }
}
