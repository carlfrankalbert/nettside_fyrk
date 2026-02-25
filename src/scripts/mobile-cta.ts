/**
 * Shared mobile CTA bar logic for tool pages.
 *
 * Syncs a sticky mobile submit button with the React form component
 * via custom DOM events. Handles loading state, visibility toggle,
 * and button disable logic.
 */

const SPINNER_SVG = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>`;

export interface MobileCTAConfig {
  /** Tool name used as event prefix (e.g., 'okr') — listens for `${toolName}:inputChange` */
  toolName: string;
  /** Button element ID (default: 'mobile-submit-btn') */
  buttonId?: string;
  /** Custom submit event name (default: `${toolName}:submit`) */
  submitEvent?: string;
  /** Determines if button should be disabled based on event detail */
  isDisabled: (detail: Record<string, unknown>) => boolean;
  /** Detail field that indicates result/preview is shown → hide CTA bar (default: 'hasResult') */
  hideField?: string;
  /** Loading state text — if null, button HTML is not updated on loading */
  loadingText?: string | null;
  /** Default (non-loading) button inner HTML */
  defaultHtml: string;
}

/**
 * Initialize mobile CTA bar behavior for a tool page.
 * Call once from the page's inline <script>.
 */
export function initMobileCTA(config: MobileCTAConfig): void {
  const {
    toolName,
    buttonId = 'mobile-submit-btn',
    submitEvent = `${toolName}:submit`,
    isDisabled,
    hideField = 'hasResult',
    loadingText = null,
    defaultHtml,
  } = config;

  const mobileBtn = document.getElementById(buttonId) as HTMLButtonElement | null;
  const mobileCTABar = document.getElementById('mobile-cta-bar');

  if (!mobileBtn || !mobileCTABar) return;

  window.addEventListener(`${toolName}:inputChange`, ((e: CustomEvent) => {
    const detail = e.detail as Record<string, unknown>;
    mobileBtn.disabled = isDisabled(detail);

    // Hide bar when result/preview is shown
    if (detail[hideField]) {
      mobileCTABar.classList.add('translate-y-full');
    } else {
      mobileCTABar.classList.remove('translate-y-full');
    }

    // Update button HTML for loading state (if configured)
    if (loadingText !== null) {
      if (detail.isLoading) {
        mobileBtn.innerHTML = `${SPINNER_SVG}<span>${loadingText}</span>`;
      } else {
        mobileBtn.innerHTML = defaultHtml;
      }
    }
  }) as EventListener);

  // Forward click to main form
  mobileBtn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent(submitEvent));
  });
}
