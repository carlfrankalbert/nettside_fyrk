import { useState, useRef, useEffect, useCallback } from 'react';
import { speileKonseptStreaming, ERROR_MESSAGES, isValidOutput } from '../services/konseptspeil-service';
import KonseptSpeilResultDisplayV2 from './KonseptSpeilResultDisplayV2';
import { SpinnerIcon } from './ui/Icon';
import { ValidationError } from './ui/ValidationError';
import { StreamingError } from './ui/StreamingError';
import { PrivacyAccordion } from './ui/PrivacyAccordion';
import { cn } from '../utils/classes';
import { INPUT_VALIDATION, STREAMING_CONSTANTS } from '../utils/constants';
import { konseptspeilTool } from '../data/tools';

const EXAMPLE_KONSEPT = konseptspeilTool.example;
const SHORT_EXAMPLE = konseptspeilTool.shortExample;
const { ui } = konseptspeilTool;
import { trackClick } from '../utils/tracking';
import { validateKonseptInput } from '../utils/form-validation';
import { useStreamingForm } from '../hooks/useStreamingForm';
import { useFormInputHandlers } from '../hooks/useFormInputHandlers';

// ============================================================================
// Constants
// ============================================================================

const { SUBMIT_THRESHOLD } = STREAMING_CONSTANTS;

// ============================================================================
// Component
// ============================================================================

export default function KonseptSpeil() {
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
    toolName: 'konseptspeil',
    validateInput: validateKonseptInput,
    streamingService: speileKonseptStreaming,
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
    toolName: 'konseptspeil',
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
    trackClick('konseptspeil_example');
    setIsExampleAnimating(true);
    setInput(EXAMPLE_KONSEPT);
    clearError();

    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(EXAMPLE_KONSEPT.length, EXAMPLE_KONSEPT.length);
      }
    }, 50);

    setTimeout(() => {
      setIsExampleAnimating(false);
    }, 600);
  };

  const handleFillShortExample = () => {
    trackClick('konseptspeil_example');
    setIsExampleAnimating(true);
    setInput(SHORT_EXAMPLE);
    clearError();

    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(SHORT_EXAMPLE.length, SHORT_EXAMPLE.length);
      }
    }, 50);

    setTimeout(() => {
      setIsExampleAnimating(false);
    }, 600);
  };

  const handleEditInput = () => {
    trackClick('konseptspeil_edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 300);
  };

  const handleFullReset = useCallback(() => {
    trackClick('konseptspeil_reset');
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
      {/* Example section - shows what mirroring actually does */}
      {!input && !loading && !result && (
        <section className="p-4 bg-neutral-100 border border-neutral-200 rounded-xl">
          <p className="text-sm font-medium text-neutral-700 mb-3">
            {ui.exampleIntro}
          </p>
          <p className="text-sm text-neutral-600 italic mb-3 leading-relaxed">
            "Vi vurderer å bygge et enkelt refleksjonsverktøy for produktteam. Tanken er at det skal brukes tidlig i en beslutningsprosess..."
          </p>
          <div className="text-xs text-neutral-500 mb-3 space-y-1">
            <p className="font-medium text-neutral-600">Speilet vil typisk:</p>
            <ul className="space-y-0.5 ml-3">
              <li>– stille spørsmål ved problemet</li>
              <li>– peke på antagelser</li>
              <li>– vise hva som ikke er konkretisert</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={handleFillShortExample}
            className="text-sm text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded transition-colors"
          >
            {ui.exampleShortButton}
          </button>
        </section>
      )}

      {/* Preview - what user will get */}
      {!result && !loading && (
        <section className="text-sm text-neutral-600">
          <p className="font-medium text-neutral-700 mb-2">{ui.previewHeading}</p>
          <ul className="space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-neutral-400">–</span>
              <span>En speiling av ideen fra 4 perspektiver</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-400">–</span>
              <span>Antagelser teksten din tar for gitt</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-400">–</span>
              <span>1–2 områder som er mest uklare</span>
            </li>
          </ul>
        </section>
      )}

      {/* Input section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="konsept-input" className="block text-base font-medium text-neutral-700">
            {ui.inputLabel}
          </label>
          {!input && !loading && (
            <button
              type="button"
              onClick={handleFillExample}
              className="text-sm text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded transition-colors"
            >
              {ui.exampleButton}
            </button>
          )}
        </div>

        {/* Encouragement for unfinished text */}
        <p className="text-xs text-neutral-500 mb-2">
          {ui.encouragement}
        </p>

        <textarea
          ref={textareaRef}
          id="konsept-input"
          value={input}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="F.eks: Vi tror at... Problemet er... Målgruppen er..."
          maxLength={INPUT_VALIDATION.MAX_LENGTH}
          aria-describedby={error ? 'konsept-error konsept-help konsept-helper' : 'konsept-help konsept-helper'}
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
        <div id="konsept-help" className="mt-3 flex items-center justify-between gap-4">
          {/* Contextual helper message */}
          <div
            id="konsept-helper"
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

          {/* Character counter */}
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


      {/* Action buttons - desktop only (mobile uses sticky bar) */}
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

        {/* Validation errors (input length) shown inline near button */}
        {error && errorType === 'validation' && (
          <ValidationError message={error} id="konsept-error" />
        )}
      </div>

      {/* Mobile: Show validation error inline */}
      <div className="md:hidden">
        {error && errorType === 'validation' && (
          <ValidationError message={error} id="konsept-error" />
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

        {/* Result display - also handles loading state with NarrativeLoader */}
        {(result || isStreaming) && (
          <div className="p-6 bg-white border-2 border-neutral-200 rounded-xl shadow-sm">
            <KonseptSpeilResultDisplayV2
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
        toolName="konseptspeil"
        introText={ui.privacy.introText}
        howItWorks={ui.privacy.howItWorks}
      />
    </div>
  );
}
