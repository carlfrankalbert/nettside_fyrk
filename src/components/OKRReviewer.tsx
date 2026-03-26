import { useState, useRef, useEffect, useCallback } from 'react';
import { reviewOKRStreaming } from '../services/okr-service';
import OKRResultDisplay from './OKRResultDisplay';
import { ErrorIcon, SpinnerIcon } from './ui/Icon';
import { PrivacyAccordion } from './ui/PrivacyAccordion';
import { cn } from '../utils/classes';
import { INPUT_VALIDATION, UI_TIMING, OKR_CONTEXT_OPTIONS } from '../utils/constants';
import { trackClick, logEvent } from '../utils/tracking';
import { validateOKRInput } from '../utils/form-validation';
import { isValidOKROutput } from '../utils/output-validators';
import { useFormInputHandlers } from '../hooks/useFormInputHandlers';
import { okrTool } from '../data/tools';
import { scrollToTopAndFocus, scrollToElement } from '../utils/form-interactions';

const EXAMPLE_OKR = okrTool.example;
const { ui } = okrTool;

export default function OKRReviewer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExampleAnimating, setIsExampleAnimating] = useState(false);
  const [industry, setIndustry] = useState('');
  const [teamType, setTeamType] = useState('');
  const [maturity, setMaturity] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const hardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const checkStartTimeRef = useRef<number>(0);
  const isSubmittingRef = useRef(false);
  const finalResultRef = useRef('');

  const clearError = useCallback(() => setError(null), []);
  const trimmedLength = input.trim().length;
  const isButtonEnabled = !loading && trimmedLength >= INPUT_VALIDATION.MIN_LENGTH;

  // Cleanup timers and abort controller on unmount
  useEffect(() => {
    return () => {
      if (hardTimeoutRef.current) clearTimeout(hardTimeoutRef.current);
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
    trackClick('okr_reset');
    setResult(null);
    setError(null);
    setInput('');
    setIndustry('');
    setTeamType('');
    setMaturity('');
    scrollToTopAndFocus(textareaRef);
  };

  const handleSubmit = useCallback(async (overrideInput?: string) => {
    // Prevent duplicate submissions using ref for synchronous check
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;

    const effectiveInput = overrideInput ?? input;

    // Validate input
    const validationError = validateOKRInput(effectiveInput);
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
    finalResultRef.current = '';

    // Cancel any existing request and create new abort controller
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Set up hard timeout (60s safety net)
    if (hardTimeoutRef.current) clearTimeout(hardTimeoutRef.current);
    hardTimeoutRef.current = setTimeout(() => {
      hardTimeoutRef.current = null;
      abortControllerRef.current?.abort();
      setError('Det tok litt for lang tid. Prøv igjen.');
      setLoading(false);
      setIsStreaming(false);
      setResult(null);
      abortControllerRef.current = null;
      isSubmittingRef.current = false;
    }, 60_000);

    // Build contextual input with optional context prefix
    const contextLines: string[] = [];
    const industryOption = OKR_CONTEXT_OPTIONS.industry.find(o => o.value === industry);
    const teamTypeOption = OKR_CONTEXT_OPTIONS.teamType.find(o => o.value === teamType);
    const maturityOption = OKR_CONTEXT_OPTIONS.maturity.find(o => o.value === maturity);
    if (industryOption && industry) contextLines.push(`Bransje: ${industryOption.label}`);
    if (teamTypeOption && teamType) contextLines.push(`Teamtype: ${teamTypeOption.label}`);
    if (maturityOption && maturity) contextLines.push(`OKR-modenhet: ${maturityOption.label}`);

    const contextPrefix = contextLines.length > 0
      ? `[Kontekst]\n${contextLines.join('\n')}\n\n[OKR-sett]\n`
      : '';

    await reviewOKRStreaming(
      contextPrefix + effectiveInput.trim(),
      (chunk) => {
        // Append streaming chunk
        finalResultRef.current += chunk;
        setResult((prev) => (prev || '') + chunk);
      },
      () => {
        // Clear hard timeout
        if (hardTimeoutRef.current) { clearTimeout(hardTimeoutRef.current); hardTimeoutRef.current = null; }

        // Validate output before marking success
        if (!finalResultRef.current || !isValidOKROutput(finalResultRef.current)) {
          setError('Kunne ikke generere en komplett vurdering. Prøv igjen.');
          setLoading(false);
          setIsStreaming(false);
          setResult(null);
          abortControllerRef.current = null;
          isSubmittingRef.current = false;
          return;
        }

        // Streaming complete — valid output
        setLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
        isSubmittingRef.current = false;

        // Track successful completion with metadata
        const processingTimeMs = Date.now() - checkStartTimeRef.current;
        logEvent('check_success', {
          charCount: effectiveInput.trim().length,
          processingTimeMs,
        });

        // Scroll to result
        scrollToElement(resultRef, UI_TIMING.SCROLL_DELAY_MS);
      },
      (errorMsg) => {
        // Clear hard timeout
        if (hardTimeoutRef.current) { clearTimeout(hardTimeoutRef.current); hardTimeoutRef.current = null; }

        // Error occurred
        setError(errorMsg);
        setLoading(false);
        setIsStreaming(false);
        setResult(null);
        abortControllerRef.current = null;
        isSubmittingRef.current = false;

        // Track error
        logEvent('okr_error', {
          charCount: effectiveInput.trim().length,
          processingTimeMs: Date.now() - checkStartTimeRef.current,
        });
      },
      abortControllerRef.current.signal
    );
  }, [input, loading, industry, teamType, maturity]);

  const handleReEvaluate = useCallback((suggestion: string) => {
    setInput(suggestion);
    setResult(null);
    setError(null);
    handleSubmit(suggestion);
  }, [handleSubmit]);

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
      {/* Context section */}
      <details className="group rounded-lg border border-dashed border-brand-cyan-light bg-brand-cyan-lightest/30 transition-colors open:border-solid open:border-brand-cyan open:bg-brand-cyan-lightest/50">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-brand-navy hover:text-brand-cyan-darker select-none list-none flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-cyan-darker transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {ui.contextToggle}
        </summary>
        <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="okr-industry" className="block text-sm font-medium text-neutral-600 mb-1">
              {ui.industryLabel}
            </label>
            <select
              id="okr-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker disabled:opacity-60"
            >
              {OKR_CONTEXT_OPTIONS.industry.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="okr-team-type" className="block text-sm font-medium text-neutral-600 mb-1">
              {ui.teamTypeLabel}
            </label>
            <select
              id="okr-team-type"
              value={teamType}
              onChange={(e) => setTeamType(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker disabled:opacity-60"
            >
              {OKR_CONTEXT_OPTIONS.teamType.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="okr-maturity" className="block text-sm font-medium text-neutral-600 mb-1">
              {ui.maturityLabel}
            </label>
            <select
              id="okr-maturity"
              value={maturity}
              onChange={(e) => setMaturity(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker disabled:opacity-60"
            >
              {OKR_CONTEXT_OPTIONS.maturity.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </details>

      {/* Input section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="okr-input"
            className="block text-base font-medium text-neutral-700"
          >
            {ui.inputLabel}
          </label>
          <button
            type="button"
            onClick={handleFillExample}
            disabled={loading}
            className="text-sm text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 focus:bg-neutral-100 focus:px-2 focus:-mx-2 rounded transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {ui.exampleButton}
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
          onClick={() => handleSubmit()}
          disabled={loading}
          aria-busy={loading}
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-brand-navy rounded-lg hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              <span>{ui.loadingButton}</span>
            </>
          ) : (
            ui.submitButton
          )}
        </button>

        {result && !loading && (
          <button
            type="button"
            onClick={handleClearResult}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
          >
            {ui.resetButton}
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
        aria-label={ui.resultLabel}
      >
        {loading && !result && (
          <div className="mt-8 p-6 bg-white border-2 border-neutral-200 rounded-lg">
            <div className="flex items-center gap-3 text-neutral-500">
              <SpinnerIcon className="animate-spin h-5 w-5" />
              <span>{ui.loadingMessage}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 p-6 bg-white border-2 border-neutral-200 rounded-lg shadow-sm">
            <OKRResultDisplay result={result} isStreaming={isStreaming} onReEvaluate={handleReEvaluate} />
            {/* Reset button */}
            {!loading && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={handleClearResult}
                  className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
                >
                  {ui.resetButton}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI og personvern */}
      <PrivacyAccordion
        toolName="okr"
        introText={ui.privacy.introText}
        howItWorks={ui.privacy.howItWorks}
      />
    </div>
  );
}
