import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { generateAssumptionsStreaming, ERROR_MESSAGES, isValidOutput } from '../services/antakelseskart-service';
import AntakelseskartResultDisplay from './AntakelseskartResultDisplay';
import { SpinnerIcon, ChevronRightIcon } from './ui/Icon';
import { cn } from '../utils/classes';
import { INPUT_VALIDATION, STREAMING_CONSTANTS } from '../utils/constants';
import { trackClick } from '../utils/tracking';
import { debounce } from '../utils/debounce';
import { isUrlEncoded, safeDecodeURIComponent } from '../utils/url-decoding';
import { validateBeslutningInput } from '../utils/form-validation';
import { useStreamingForm } from '../hooks/useStreamingForm';

// ============================================================================
// Constants
// ============================================================================

const { SUBMIT_THRESHOLD } = STREAMING_CONSTANTS;

// Example decision for the tool
const EXAMPLE_DECISION = `Vi vurderer å lansere en abonnementsbasert tjeneste for produktteam som vil ha raskere tilgang til brukerinnsikt.

Tanken er at produktledere i mellomstore selskaper sliter med å få nok tid til å snakke med brukere, og at en AI-drevet løsning kan analysere eksisterende kundedata og generere innsikt automatisk.

Vi tror dette kan redusere tiden fra "idé til validert innsikt" betydelig, og at teamene vil betale for å spare tid. Planen er å starte med en gratisversjon for å bygge brukermasse, og deretter konvertere til betalende kunder.`;

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
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isExampleAnimating, setIsExampleAnimating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // ---------------------------------------------------------------------------
  // Refs (component-specific)
  // ---------------------------------------------------------------------------
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasTrackedInputStartRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Derived Values
  // ---------------------------------------------------------------------------
  const charCountWarning = INPUT_VALIDATION.MAX_LENGTH * 0.9;
  const charCountDanger = INPUT_VALIDATION.MAX_LENGTH * 0.975;
  const showMinimumHelper = isFocused && trimmedLength >= 1 && trimmedLength < SUBMIT_THRESHOLD;
  const isNearingMinimum = trimmedLength >= 1 && trimmedLength < SUBMIT_THRESHOLD;

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const autoResizeTextarea = useMemo(
    () =>
      debounce(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }, 16),
    []
  );

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Dispatch events for mobile CTA sync
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('antakelseskart:inputChange', {
      detail: {
        length: trimmedLength,
        isLoading: loading,
        hasResult: !!result,
      }
    }));
  }, [trimmedLength, loading, result]);

  // Listen for mobile submit trigger
  useEffect(() => {
    const handleMobileSubmit = () => {
      handleSubmit();
    };
    window.addEventListener('antakelseskart:submit', handleMobileSubmit);
    return () => window.removeEventListener('antakelseskart:submit', handleMobileSubmit);
  }, [handleSubmit]);

  // Auto-resize textarea when input changes
  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

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

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text/plain');

    if (isUrlEncoded(pastedText)) {
      e.preventDefault();
      const decodedText = safeDecodeURIComponent(pastedText);

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue = input.substring(0, start) + decodedText + input.substring(end);
      setInput(newValue);
      if (error) clearError();

      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + decodedText.length;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isButtonEnabled) {
        handleSubmit();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    if (isUrlEncoded(newValue)) {
      newValue = safeDecodeURIComponent(newValue);
    }

    // Track first input (funnel start) - only fire once per session
    if (!hasTrackedInputStartRef.current && newValue.length > 0 && input.length === 0) {
      hasTrackedInputStartRef.current = true;
      trackClick('antakelseskart_input_started');
    }

    setInput(newValue);
    if (error) clearError();
  };

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
            Beskriv beslutningen
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
                Skriv litt mer for å avdekke antakelser.
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
                <span>Avdekker antakelser...</span>
              </>
            ) : (
              <span>Avdekk antakelser</span>
            )}
          </button>
        </div>

        {/* Validation errors */}
        {error && errorType === 'validation' && (
          <div id="beslutning-error" role="alert" className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-neutral-700">{error}</p>
          </div>
        )}
      </div>

      {/* Mobile: Show validation error inline */}
      <div className="md:hidden">
        {error && errorType === 'validation' && (
          <div id="beslutning-error" role="alert" className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-neutral-700">{error}</p>
          </div>
        )}
      </div>

      {/* Result area */}
      <div
        ref={resultRef}
        aria-live="polite"
        aria-atomic="false"
        role="region"
        aria-label="Antakelser"
      >
        {/* Error display in results area */}
        {error && !loading && !result && errorType !== 'validation' && (
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] text-neutral-700 leading-[1.5] mb-4">{error}</p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-brand-navy bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
                >
                  Prøv igjen
                </button>
              </div>
            </div>
          </div>
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
      <div className="border-t border-neutral-200 pt-6">
        <p className="text-sm text-neutral-500 mb-3">
          Teksten du skriver brukes kun til å identifisere antakelser. Unngå å lime inn konfidensiell eller sensitiv informasjon.
        </p>
        <button
          type="button"
          onClick={() => {
            if (!isPrivacyOpen) {
              trackClick('antakelseskart_privacy_toggle');
            }
            setIsPrivacyOpen(!isPrivacyOpen);
          }}
          aria-expanded={isPrivacyOpen}
          aria-controls="privacy-content"
          className="flex items-center gap-2 text-sm text-brand-navy hover:text-brand-cyan-darker focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded py-2"
        >
          <ChevronRightIcon className={cn('w-4 h-4 transition-transform', isPrivacyOpen && 'rotate-90')} />
          Les mer om AI og personvern
        </button>
        {isPrivacyOpen && (
          <div
            id="privacy-content"
            className="mt-3 p-4 bg-neutral-100 rounded-lg text-sm text-neutral-700 space-y-3"
          >
            <p>
              <strong>Hvordan fungerer det?</strong><br />
              Antakelsene genereres av Claude (Anthropic). Verktøyet analyserer teksten og identifiserer implisitte forutsetninger.
            </p>
            <p>
              <strong>Hva skjer med dataene?</strong><br />
              Teksten sendes til Claude API for å generere antakelsene. Vi lagrer ikke innholdet, og det brukes ikke til å trene AI-modeller.
            </p>
            <p>
              <strong>Er det trygt?</strong><br />
              Du trenger ikke logge inn. Ikke del personopplysninger, forretningshemmeligheter eller annen sensitiv informasjon i teksten du sender inn.
            </p>
            <p className="pt-2 border-t border-neutral-200">
              <a
                href="https://fyrk.no/personvern"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2"
              >
                Les FYRKs personvernerklæring
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
