import { useState, useRef, useEffect, useCallback } from 'react';
import { speileKonseptStreaming, ERROR_MESSAGES, isValidOutput } from '../services/konseptspeil-service';
import KonseptSpeilResultDisplayV2 from './KonseptSpeilResultDisplayV2';
import { SpinnerIcon, ChevronRightIcon } from './ui/Icon';
import { cn } from '../utils/classes';
import { INPUT_VALIDATION } from '../utils/constants';
import { trackClick } from '../utils/tracking';

// ============================================================================
// Constants
// ============================================================================

const EXAMPLE_KONSEPT = `Jeg vurderer å bygge et lite verktøy for team som sliter med prioritering. Vi har mange initiativer samtidig, og det er uklart hva som faktisk er viktig. Jeg tror det finnes et reelt problem, men vi har ikke testet det ordentlig. Målet er å få mer klarhet før vi bestemmer oss.`;

/** Minimum characters required for button to be enabled (higher than MIN_LENGTH for UX) */
const SUBMIT_THRESHOLD = 50;

/** Timeout thresholds in milliseconds */
const SLOW_TIMEOUT_MS = 8000;
const HARD_TIMEOUT_MS = 20000;

/** Error types for logging */
type ErrorType = 'timeout' | 'network' | 'invalid_output' | 'validation' | null;

// ============================================================================
// Input Helpers
// ============================================================================

/** Check if text appears to be URL-encoded */
function isUrlEncoded(text: string): boolean {
  const urlEncodedPattern = /%[0-9A-Fa-f]{2}/;
  if (!urlEncodedPattern.test(text)) return false;
  const commonEncodings = ['%20', '%0A', '%0D', '%C3'];
  return commonEncodings.some((enc) => text.includes(enc));
}

/** Safely decode URL-encoded text */
function safeDecodeURIComponent(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/** Validates konsept input and returns an error message if invalid */
function validateKonseptInput(input: string): string | null {
  const trimmedInput = input.trim();

  if (trimmedInput.length < INPUT_VALIDATION.MIN_LENGTH) {
    return `Beskriv konseptet med minst ${INPUT_VALIDATION.MIN_LENGTH} tegn for å få en god refleksjon.`;
  }

  if (trimmedInput.length > INPUT_VALIDATION.MAX_LENGTH) {
    return `Konseptbeskrivelsen kan ikke være lengre enn ${INPUT_VALIDATION.MAX_LENGTH} tegn.`;
  }

  return null;
}

// ============================================================================
// Component
// ============================================================================

export default function KonseptSpeil() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isExampleAnimating, setIsExampleAnimating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const slowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Derived Values
  // ---------------------------------------------------------------------------
  const charCountWarning = INPUT_VALIDATION.MAX_LENGTH * 0.9;
  const charCountDanger = INPUT_VALIDATION.MAX_LENGTH * 0.975;
  const trimmedLength = input.trim().length;
  const isButtonEnabled = trimmedLength >= SUBMIT_THRESHOLD && !loading;
  const showMinimumHelper = isFocused && trimmedLength >= 1 && trimmedLength < SUBMIT_THRESHOLD;
  const isNearingMinimum = trimmedLength >= 1 && trimmedLength < SUBMIT_THRESHOLD;

  // ---------------------------------------------------------------------------
  // Callbacks (defined before effects that use them)
  // ---------------------------------------------------------------------------

  /** Auto-resize textarea to fit content */
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  /** Clear all pending timeouts */
  const clearTimeouts = useCallback(() => {
    if (slowTimeoutRef.current) {
      clearTimeout(slowTimeoutRef.current);
      slowTimeoutRef.current = null;
    }
    if (hardTimeoutRef.current) {
      clearTimeout(hardTimeoutRef.current);
      hardTimeoutRef.current = null;
    }
    setIsSlow(false);
  }, []);

  /** Set an error with type tracking for logging */
  const setErrorWithType = useCallback((message: string, type: ErrorType) => {
    setError(message);
    setErrorType(type);
    if (type) {
      console.warn(`[Konseptspeil] Error: ${type}`);
    }
  }, []);

  /** Submit the konsept for AI reflection */
  const handleSubmit = useCallback(async () => {
    if (loading) return;

    const validationError = validateKonseptInput(input);
    if (validationError) {
      setErrorWithType(validationError, 'validation');
      return;
    }

    trackClick('konseptspeil_submit');

    // Clear previous state
    setLoading(true);
    setIsStreaming(true);
    setError(null);
    setErrorType(null);
    setResult('');
    setIsSlow(false);
    clearTimeouts();

    // Abort any previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Set up slow timeout (8 seconds)
    slowTimeoutRef.current = setTimeout(() => {
      setIsSlow(true);
    }, SLOW_TIMEOUT_MS);

    // Set up hard timeout (20 seconds)
    hardTimeoutRef.current = setTimeout(() => {
      clearTimeouts();
      abortControllerRef.current?.abort();
      setErrorWithType(ERROR_MESSAGES.TIMEOUT, 'timeout');
      setLoading(false);
      setIsStreaming(false);
      setResult(null);
      abortControllerRef.current = null;
    }, HARD_TIMEOUT_MS);

    let finalResult = '';

    await speileKonseptStreaming(
      input.trim(),
      (chunk) => {
        finalResult += chunk;
        setResult((prev) => (prev || '') + chunk);
      },
      () => {
        clearTimeouts();

        // Validate output format
        if (!isValidOutput(finalResult)) {
          setErrorWithType(ERROR_MESSAGES.INVALID_OUTPUT, 'invalid_output');
          setLoading(false);
          setIsStreaming(false);
          setResult(null);
          abortControllerRef.current = null;
          return;
        }

        setLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      (errorMsg) => {
        clearTimeouts();
        // Determine error type based on message
        const type: ErrorType = errorMsg.includes('koble til') ? 'network' : 'network';
        setErrorWithType(errorMsg, type);
        setLoading(false);
        setIsStreaming(false);
        setResult(null);
        abortControllerRef.current = null;
      },
      abortControllerRef.current.signal
    );
  }, [input, loading, clearTimeouts, setErrorWithType]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Dispatch events for mobile CTA sync
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('konseptspeil:inputChange', {
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
    window.addEventListener('konseptspeil:submit', handleMobileSubmit);
    return () => window.removeEventListener('konseptspeil:submit', handleMobileSubmit);
  }, [handleSubmit]);

  // Auto-resize textarea when input changes
  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

  // Cleanup abort controller and timeouts on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /** Handle paste events to decode URL-encoded text */
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
      if (error) setError(null);

      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + decodedText.length;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  /** Fill in example text */
  const handleFillExample = () => {
    trackClick('konseptspeil_example');
    setIsExampleAnimating(true);
    setInput(EXAMPLE_KONSEPT);
    setError(null);

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

  /** Reset form and clear result */
  const handleClearResult = () => {
    trackClick('konseptspeil_reset');
    setResult(null);
    setError(null);
    setInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  /** Handle keyboard shortcuts (Cmd/Ctrl+Enter to submit) */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isButtonEnabled) {
        handleSubmit();
      }
    }
  };

  /** Handle input change with URL decoding */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    if (isUrlEncoded(newValue)) {
      newValue = safeDecodeURIComponent(newValue);
    }
    setInput(newValue);
    if (error) setError(null);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Input section */}
      <section>
        <label htmlFor="konsept-input" className="block text-sm font-medium text-neutral-700 mb-2">
          Beskriv konseptet ditt
        </label>

        <div className="relative">
          <textarea
            ref={textareaRef}
            id="konsept-input"
            value={input}
            onChange={handleInputChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Hva vurderer du å bygge – og hvorfor?"
            maxLength={INPUT_VALIDATION.MAX_LENGTH}
            aria-describedby={error ? 'konsept-error konsept-help konsept-helper' : 'konsept-help konsept-helper'}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'w-full px-4 py-4 text-base text-neutral-800 bg-white border-2 rounded-xl',
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
          {!input && !loading && (
            <button
              type="button"
              onClick={handleFillExample}
              className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-navy bg-brand-cyan-lightest hover:bg-brand-cyan-light border border-brand-cyan/40 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Prøv med eksempel
            </button>
          )}
        </div>

        {/* Help text */}
        <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
          Uferdige tanker er velkomne. Skriv om problemet, hvem det gjelder, og hva du tenker å gjøre.
        </p>

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
                Skriv litt mer for å få en refleksjon.
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
            <span> / {INPUT_VALIDATION.MAX_LENGTH}</span>
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
                <span>Speiler konseptet…</span>
              </>
            ) : (
              <>
                <span>Speil konseptet</span>
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {/* CTA support text */}
          {!result && !loading && (
            <p className="text-xs text-neutral-500 leading-[1.4]">
              Du får tilbake antakelser og åpne spørsmål.
            </p>
          )}

          {result && !loading && (
            <button
              type="button"
              onClick={handleClearResult}
              className="self-start inline-flex items-center justify-center px-5 py-3 text-base font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
            >
              Start på nytt
            </button>
          )}
        </div>

        {/* Validation errors (input length) shown inline near button */}
        {error && errorType === 'validation' && (
          <div id="konsept-error" role="alert" className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start gap-3">
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
          <div id="konsept-error" role="alert" className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start gap-3">
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
        aria-label="Refleksjonsresultat"
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

        {/* Loading state */}
        {loading && !result && (
          <div className="p-6 bg-white border-2 border-brand-cyan/30 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-cyan-lightest flex items-center justify-center">
                <SpinnerIcon className="animate-spin h-5 w-5 text-brand-cyan-darker" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-neutral-800 leading-[1.5]">Speiler konseptet…</p>
                {isSlow ? (
                  <p className="text-xs text-neutral-500 leading-[1.4]">Dette tar litt lenger tid enn vanlig …</p>
                ) : (
                  <p className="text-xs text-neutral-500 leading-[1.4]">Dette tar vanligvis 15-30 sekunder</p>
                )}
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="p-6 bg-white border-2 border-neutral-200 rounded-xl shadow-sm">
            <KonseptSpeilResultDisplayV2
              result={result}
              isStreaming={isStreaming}
              onRetry={handleSubmit}
              onReset={handleClearResult}
            />
          </div>
        )}
      </div>

      {/* CTA section - shown after result */}
      {result && !loading && (
        <section className="p-5 bg-brand-cyan-lightest/30 border border-brand-cyan/20 rounded-xl">
          <h3 className="text-base font-semibold text-brand-navy mb-2">
            Vil du gå dypere?
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed mb-4">
            En 20-minutters sparring kan hjelpe deg prioritere hva som er viktigst å avklare først.
          </p>
          <a
            href="https://fyrk.no/kontakt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-navy hover:bg-brand-navy/90 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
          >
            <span>📅</span>
            Book gratis sparring med FYRK
          </a>
        </section>
      )}

      {/* Trygghet og personvern - secondary section */}
      <section id="trygghet" className="pt-4">
        <button
          type="button"
          onClick={() => {
            if (!isPrivacyOpen) {
              trackClick('konseptspeil_privacy_toggle');
            }
            setIsPrivacyOpen(!isPrivacyOpen);
          }}
          aria-expanded={isPrivacyOpen}
          aria-controls="privacy-content"
          className="w-full flex items-center justify-between py-2 text-left focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded-lg"
        >
          <span className="text-sm font-medium text-neutral-500 leading-[1.3]">Trygghet og personvern</span>
          <ChevronRightIcon className={cn('w-4 h-4 text-neutral-400 transition-transform', isPrivacyOpen && 'rotate-90')} />
        </button>

        {isPrivacyOpen && (
          <div
            id="privacy-content"
            className="mt-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3 text-sm"
          >
            <div>
              <h3 className="font-medium text-neutral-700 mb-1">Hvordan fungerer det?</h3>
              <p className="text-neutral-600 leading-relaxed">
                Refleksjonen genereres av Claude (Anthropic), en AI-modell som analyserer konseptbeskrivelsen og speiler tilbake observasjoner.
              </p>
              <p className="text-neutral-600 leading-relaxed mt-2">
                Refleksjonen er strukturert rundt de fire produktrisikoene (verdi, brukbarhet, gjennomførbarhet, levedyktighet) – et rammeverk kjent fra blant annet Marty Cagans arbeid med produktutvikling.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-neutral-700 mb-1">Hva skjer med dataene?</h3>
              <p className="text-neutral-600 leading-relaxed">
                Sendes til Claude API for å generere refleksjonen. Vi lagrer ikke innholdet, og det brukes ikke til å trene AI-modeller.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-neutral-700 mb-1">Er det trygt?</h3>
              <p className="text-neutral-600 leading-relaxed">
                Ja, ingen innlogging, ingen persondata samles inn.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
