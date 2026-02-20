import { useState, useRef, useEffect, useCallback } from 'react';
import { generateAssumptionsStreaming, ERROR_MESSAGES, isValidOutput } from '../services/antakelseskart-service';
import AntakelseskartResultDisplay from './AntakelseskartResultDisplay';
import { SpinnerIcon } from './ui/Icon';
import { ValidationError } from './ui/ValidationError';
import { StreamingError } from './ui/StreamingError';
import { PrivacyAccordion } from './ui/PrivacyAccordion';
import { cn } from '../utils/classes';
import { INPUT_VALIDATION, STREAMING_CONSTANTS } from '../utils/constants';
import { trackClick } from '../utils/tracking';
import { validateBeslutningInput } from '../utils/form-validation';
import { useStreamingForm } from '../hooks/useStreamingForm';
import { useFormInputHandlers } from '../hooks/useFormInputHandlers';
import { antakelseskartTool } from '../data/tools';

// ============================================================================
// Constants
// ============================================================================

const { SUBMIT_THRESHOLD } = STREAMING_CONSTANTS;
const EXAMPLE_DECISION = antakelseskartTool.example;
const { ui } = antakelseskartTool;

// ============================================================================
// Component
// ============================================================================

export default function Antakelseskart() {
  // ---------------------------------------------------------------------------
  // Streaming Form Hook
  // ---------------------------------------------------------------------------
  const {
    input,
    setInput,
    loading,
    error,
    errorType,
    result,
    isStreaming,
    submittedInput,
    trimmedLength,
    isButtonEnabled,
    handleSubmit,
    clearError,
    reset,
    abortControllerRef,
  } = useStreamingForm({
    toolName: 'antakelseskart',
    validateInput: validateBeslutningInput,
    streamingService: generateAssumptionsStreaming,
    isValidOutput,
    errorMessages: ERROR_MESSAGES,
  });

  // ---------------------------------------------------------------------------
  // UI State (component-specific)
  // ---------------------------------------------------------------------------
  const [isExampleAnimating, setIsExampleAnimating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // ---------------------------------------------------------------------------
  // Refs (component-specific)
  // ---------------------------------------------------------------------------
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ---------------------------------------------------------------------------
  // Form Input Handlers Hook
  // ---------------------------------------------------------------------------
  const {
    handlePaste,
    handleKeyDown,
    handleInputChange,
  } = useFormInputHandlers({
    toolName: 'antakelseskart',
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

  // ---------------------------------------------------------------------------
  // Derived Values
  // ---------------------------------------------------------------------------
  const charCountWarning = INPUT_VALIDATION.MAX_LENGTH * 0.9;
  const charCountDanger = INPUT_VALIDATION.MAX_LENGTH * 0.975;
  const showMinimumHelper = isFocused && trimmedLength >= 1 && trimmedLength < SUBMIT_THRESHOLD;
  const isNearingMinimum = trimmedLength >= 1 && trimmedLength < SUBMIT_THRESHOLD;

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [abortControllerRef]);

  // Scroll to results when streaming completes
  useEffect(() => {
    if (!isStreaming && result) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isStreaming, result]);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  const handleFillExample = () => {
    trackClick('antakelseskart_example');
    setIsExampleAnimating(true);
    setInput(EXAMPLE_DECISION);
    clearError();

    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(EXAMPLE_DECISION.length, EXAMPLE_DECISION.length);
      }
    }, 50);

    setTimeout(() => {
      setIsExampleAnimating(false);
    }, 600);
  };

  const handleEditInput = () => {
    trackClick('antakelseskart_edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 300);
  };

  const handleFullReset = useCallback(() => {
    trackClick('antakelseskart_reset');
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, [reset]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Example section */}
      {!input && !loading && !result && (
        <section className="p-4 bg-neutral-100 border border-neutral-200 rounded-xl">
          <p className="text-sm text-neutral-600 mb-2">
            <span className="font-medium">Eksempel:</span>
          </p>
          <p className="text-sm text-neutral-600 italic mb-3 leading-relaxed">
            "Vi vurderer å lansere en abonnementsbasert tjeneste for produktteam som vil ha raskere tilgang til brukerinnsikt..."
          </p>
          <p className="text-xs text-neutral-500 mb-3">
            Verktøyet vil typisk avdekke 8-15 implisitte antakelser om målgruppe, behov, løsning og forretningsmodell.
          </p>
          <button
            type="button"
            onClick={handleFillExample}
            className="text-sm text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded transition-colors"
          >
            Prøv dette eksempelet
          </button>
        </section>
      )}

      {/* Input section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="beslutning-input" className="block text-base font-medium text-neutral-700">
            {ui.inputLabel}
          </label>
        </div>

        <textarea
          ref={textareaRef}
          id="beslutning-input"
          value={input}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Vi vurderer å... Tanken er at... Vi tror at..."
          maxLength={INPUT_VALIDATION.MAX_LENGTH}
          aria-describedby={error ? 'beslutning-error beslutning-help beslutning-helper' : 'beslutning-help beslutning-helper'}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 rounded-lg',
            'resize-none min-h-[160px] overflow-hidden',
            'placeholder:text-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'aria-[invalid=true]:border-feedback-error transition-all duration-300',
            isExampleAnimating
              ? 'border-brand-cyan bg-brand-cyan-lightest/50 ring-2 ring-brand-cyan scale-[1.01]'
              : 'border-neutral-300'
          )}
          disabled={loading}
        />

        {/* Character count and helper */}
        <div id="beslutning-help" className="mt-3 flex items-center justify-between gap-4">
          <div
            id="beslutning-helper"
            aria-live="polite"
            aria-atomic="true"
            className="min-h-[1.25rem]"
          >
            {showMinimumHelper && (
              <span className="text-xs text-neutral-500 italic">
                {ui.minimumHelper}
              </span>
            )}
          </div>

          <span className={cn(
            'text-xs transition-colors',
            isNearingMinimum ? 'text-neutral-600 font-medium' : 'text-neutral-500'
          )}>
            <span className={cn(
              input.length > charCountDanger && 'text-feedback-error',
              input.length > charCountWarning && input.length <= charCountDanger && 'text-feedback-warning'
            )}>
              {input.length}
            </span>
            <span> / {INPUT_VALIDATION.MAX_LENGTH} tegn</span>
          </span>
        </div>
      </section>

      {/* Action buttons - desktop only */}
      <div className="hidden md:block space-y-3">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isButtonEnabled}
            aria-busy={loading}
            className={cn(
              'inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2',
              loading
                ? 'bg-brand-navy/80 text-white cursor-wait'
                : isButtonEnabled
                  ? 'bg-brand-navy text-white hover:bg-brand-navy/90 hover:scale-[1.02] active:scale-100 shadow-lg hover:shadow-xl'
                  : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                <span>{ui.loadingButton}</span>
              </>
            ) : (
              <span>{ui.submitButton}</span>
            )}
          </button>
        </div>

        {/* Validation errors */}
        {error && errorType === 'validation' && (
          <ValidationError message={error} id="beslutning-error" />
        )}
      </div>

      {/* Mobile: Show validation error inline */}
      <div className="md:hidden">
        {error && errorType === 'validation' && (
          <ValidationError message={error} id="beslutning-error" />
        )}
      </div>

      {/* Result area */}
      <div
        ref={resultRef}
        aria-live="polite"
        aria-atomic="false"
        role="region"
        aria-label={ui.resultLabel}
      >
        {/* Error display in results area */}
        {error && !loading && !result && errorType !== 'validation' && (
          <StreamingError message={error} onRetry={handleSubmit} />
        )}

        {/* Result display */}
        {(result || isStreaming) && (
          <div className="p-6 bg-white border-2 border-neutral-200 rounded-xl shadow-sm">
            <AntakelseskartResultDisplay
              result={result || ''}
              isStreaming={isStreaming}
              originalInput={submittedInput || undefined}
              onRetry={handleSubmit}
              onEdit={handleEditInput}
              onReset={handleFullReset}
            />
          </div>
        )}
      </div>

      {/* AI og personvern */}
      <PrivacyAccordion
        toolName="antakelseskart"
        introText={ui.privacy.introText}
        howItWorks={ui.privacy.howItWorks}
      />
    </div>
  );
}
