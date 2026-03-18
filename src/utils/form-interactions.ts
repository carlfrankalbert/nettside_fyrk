/**
 * Shared form interaction utilities
 *
 * Common scroll, focus, and animation patterns used across
 * OKRReviewer, KonseptSpeil, and Antakelseskart components.
 */

import { trackClick } from './tracking';

/**
 * Scroll to top of page and focus a textarea after a delay.
 * Used by reset and edit handlers.
 */
export function scrollToTopAndFocus(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  delay = 100
): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => {
    ref.current?.focus();
  }, delay);
}

/**
 * Fill textarea with example text and trigger animation feedback.
 * Used by "try example" buttons across all tool forms.
 */
export function fillExample(
  text: string,
  setInput: (value: string) => void,
  clearError: () => void,
  setAnimating: (value: boolean) => void,
  ref: React.RefObject<HTMLTextAreaElement | null>,
  options?: {
    trackingId?: string;
    focusDelay?: number;
    animationDuration?: number;
    setCursor?: boolean;
  }
): void {
  const {
    trackingId,
    focusDelay = 50,
    animationDuration = 600,
    setCursor = true,
  } = options ?? {};

  if (trackingId) {
    trackClick(trackingId);
  }

  setAnimating(true);
  setInput(text);
  clearError();

  setTimeout(() => {
    const textarea = ref.current;
    if (textarea) {
      textarea.focus();
      if (setCursor) {
        textarea.setSelectionRange(text.length, text.length);
      }
    }
  }, focusDelay);

  setTimeout(() => {
    setAnimating(false);
  }, animationDuration);
}

/**
 * Scroll an element into view with a delay.
 * Used to scroll to results after streaming completes.
 */
export function scrollToElement(
  ref: React.RefObject<HTMLElement | null>,
  delay = 100,
  block: ScrollLogicalPosition = 'start'
): void {
  setTimeout(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block });
  }, delay);
}
