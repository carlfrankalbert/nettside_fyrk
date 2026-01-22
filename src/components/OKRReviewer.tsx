import { useState, useRef, useEffect, useCallback } from 'react';
import { reviewOKRStreaming } from '../services/okr-service';
import OKRResultDisplay from './OKRResultDisplay';
import { CheckIcon, ErrorIcon, SpinnerIcon } from './ui/Icon';
import { PrivacyAccordion } from './ui/PrivacyAccordion';
import { cn } from '../utils/classes';
import { INPUT_VALIDATION, UI_TIMING } from '../utils/constants';
import { trackClick, logEvent } from '../utils/tracking';
import { validateOKRInput } from '../utils/form-validation';
import { useFormInputHandlers } from '../hooks/useFormInputHandlers';

const EXAMPLE_OKR = `Objective:
Gjøre det enkelt og trygt for brukere å komme i gang med produktet.

Key Results:
1. Øke aktiveringsraten (fullført onboarding) fra 45 % til 70 %.
2. Redusere tid til første verdi fra 10 minutter til under 3 minutter.
3. Redusere onboarding-relaterte supporthenvendelser med 50 %.`;

export default function OKRReviewer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExampleAnimating, setIsExampleAnimating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const checkStartTimeRef = useRef<number>(0);
  const isSubmittingRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);
  const trimmedLength = input.trim().length;
  const isButtonEnabled = !loading && trimmedLength >= INPUT_VALIDATION.MIN_LENGTH;

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleFillExample = () => {
    // Track button click
    trackClick('okr_example');

    // Trigger animation
    setIsExampleAnimating(true);
    setInput(EXAMPLE_OKR);
    setError(null);

    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, UI_TIMING.DEBOUNCE_MS);

    // Reset animation state after animation completes
    setTimeout(() => {
      setIsExampleAnimating(false);
    }, UI_TIMING.ANIMATION_DELAY_MS * 2);
  };

  const handleClearResult = () => {
    // Track button click
    trackClick('okr_reset');

    setResult(null);
    setError(null);
    setInput('');
  };

  const handleSubmit = useCallback(async () => {
    // Prevent duplicate submissions using ref for synchronous check
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;

    // Validate input
    const validationError = validateOKRInput(input);
    if (validationError) {
      setError(validationError);
      isSubmittingRef.current = false;
      return;
    }

    // Track button click (fire and forget - don't block the user)
    trackClick('okr_submit');

    // Record start time for processing duration tracking
    checkStartTimeRef.current = Date.now();

    setLoading(true);
    setIsStreaming(true);
    setError(null);
    setResult('');

    // Cancel any existing request and create new abort controller
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    await reviewOKRStreaming(
      input.trim(),
      (chunk) => {
        // Append streaming chunk
        setResult((prev) => (prev || '') + chunk);
      },
      () => {
        // Streaming complete
        setLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
        isSubmittingRef.current = false;

        // Track successful completion with metadata
        const processingTimeMs = Date.now() - checkStartTimeRef.current;
        logEvent('check_success', {
          charCount: input.trim().length,
          processingTimeMs,
        });

        // Scroll to result
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, UI_TIMING.SCROLL_DELAY_MS);
      },
      (errorMsg) => {
        // Error occurred
        setError(errorMsg);
        setLoading(false);
        setIsStreaming(false);
        setResult(null);
        abortControllerRef.current = null;
        isSubmittingRef.current = false;
      },
      abortControllerRef.current.signal
    );
  }, [input, loading]);

  // Form input handlers (URL decoding, keyboard shortcuts, mobile events, auto-resize)
  const {
    handlePaste,
    handleKeyDown,
    handleInputChange,
  } = useFormInputHandlers({
    toolName: 'okr',
    input,
    setInput,
    error,
    clearError,
    isButtonEnabled,
    handleSubmit,
    textareaRef,
    loading,
    result,
    trimmedLength,
  });

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Compact info box */}
      <div className="p-4 bg-neutral-100 rounded-lg">
        <ul className="space-y-1.5 text-sm text-neutral-700" role="list">
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-feedback-success flex-shrink-0 mt-0.5" />
            <span>Lim inn <strong>Objective</strong> + <strong>Key Results</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-feedback-success flex-shrink-0 mt-0.5" />
            <span>Få vurdering, styrker og forbedringsforslag</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-feedback-success flex-shrink-0 mt-0.5" />
            <span>Under ett minutt · Ingen lagring</span>
          </li>
        </ul>
      </div>

      {/* Input section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="okr-input"
            className="block text-base font-medium text-neutral-700"
          >
            Lim inn OKR-settet ditt
          </label>
          <button
            type="button"
            onClick={handleFillExample}
            disabled={loading}
            className="text-sm text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 focus:bg-neutral-100 focus:px-2 focus:-mx-2 rounded transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Prøv med eksempel
          </button>
        </div>

        <textarea
          ref={textareaRef}
          id="okr-input"
          value={input}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Objective:
Ditt mål her...

Key Results:
1. Første målbare resultat
2. Andre målbare resultat
3. Tredje målbare resultat"
          maxLength={INPUT_VALIDATION.MAX_LENGTH}
          aria-describedby={error ? 'okr-error okr-help okr-char-count' : 'okr-help okr-char-count'}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 rounded-lg',
            'resize-none min-h-[220px] overflow-hidden placeholder:text-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'aria-[invalid=true]:border-feedback-error transition-all duration-300',
            isExampleAnimating
              ? 'border-brand-cyan bg-brand-cyan-lightest/50 ring-2 ring-brand-cyan shadow-brand-cyan scale-[1.01]'
              : 'border-neutral-300'
          )}
          disabled={loading}
        />
        <div id="okr-char-count" className="mt-1 text-xs text-neutral-500 text-right">
          <span className={cn(input.length > INPUT_VALIDATION.MAX_LENGTH * 0.9 && 'text-feedback-warning')}>
            {input.length}
          </span>
          {' / '}{INPUT_VALIDATION.MAX_LENGTH} tegn
        </div>
      </div>

      {/* Action buttons - desktop only (mobile uses sticky bar) */}
      <div className="hidden md:flex md:flex-row md:items-center gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          aria-busy={loading}
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-brand-navy rounded-lg hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              <span>Vurderer OKR-ene dine...</span>
            </>
          ) : (
            'Sjekk OKR-settet ditt'
          )}
        </button>

        {result && !loading && (
          <button
            type="button"
            onClick={handleClearResult}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
          >
            Nullstill
          </button>
        )}
      </div>

      {/* Error display - visible on all viewports */}
      {error && (
        <p id="okr-error" role="alert" className="text-feedback-error text-sm flex items-center gap-2">
          <ErrorIcon className="w-4 h-4 flex-shrink-0" />
          {error}
        </p>
      )}


      {/* Result area with structured display */}
      <div
        ref={resultRef}
        aria-live="polite"
        aria-atomic="false"
        role="region"
        aria-label="Vurderingsresultat"
      >
        {loading && !result && (
          <div className="mt-8 p-6 bg-white border-2 border-neutral-200 rounded-lg">
            <div className="flex items-center gap-3 text-neutral-500">
              <SpinnerIcon className="animate-spin h-5 w-5" />
              <span>Vurderer OKR-ene dine - dette tar vanligvis 5-10 sekunder...</span>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 p-6 bg-white border-2 border-neutral-200 rounded-lg shadow-sm">
            <OKRResultDisplay result={result} isStreaming={isStreaming} />
            {/* Reset button */}
            {!loading && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={handleClearResult}
                  className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
                >
                  Start på nytt
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI og personvern */}
      <PrivacyAccordion
        toolName="okr"
        introText="OKR-ene du legger inn brukes kun til å generere vurderingen. Unngå å lime inn konfidensiell eller sensitiv informasjon."
        howItWorks="Vurderingen genereres av Claude (Anthropic), en AI-modell som analyserer OKR-settet ditt basert på etablerte prinsipper for god målsetting."
      />
    </div>
  );
}
