import { useState, useRef, useEffect, useCallback } from 'react';
import { speileKonseptStreaming } from '../services/konseptspeil-service';
import KonseptSpeilResultDisplay from './KonseptSpeilResultDisplay';
import { ErrorIcon, SpinnerIcon, ChevronRightIcon } from './ui/Icon';
import { cn } from '../utils/classes';
import { INPUT_VALIDATION } from '../utils/constants';
import { trackClick } from '../utils/tracking';

const EXAMPLE_KONSEPT = `Vi vil lage en app som hjelper produktledere med å holde oversikt over discovery-arbeidet sitt.

Idéen er at man kan logge samtaler med brukere, tagge dem med temaer, og se mønstre over tid.

Vi tror dette er nyttig fordi mange produktledere sliter med å huske hva de har lært fra tidligere samtaler når de skal prioritere.

Målgruppen er produktledere i mellomstore tech-selskaper.`;

// Input validation constants
const MIN_INPUT_LENGTH = INPUT_VALIDATION.MIN_LENGTH;
const MAX_INPUT_LENGTH = INPUT_VALIDATION.MAX_LENGTH;

/**
 * Check if text appears to be URL-encoded
 */
function isUrlEncoded(text: string): boolean {
  const urlEncodedPattern = /%[0-9A-Fa-f]{2}/;
  if (!urlEncodedPattern.test(text)) return false;
  const commonEncodings = ['%20', '%0A', '%0D', '%C3'];
  return commonEncodings.some((enc) => text.includes(enc));
}

/**
 * Safely decode URL-encoded text
 */
function safeDecodeURIComponent(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/**
 * Validates konsept input
 */
function validateKonseptInput(input: string): string | null {
  const trimmedInput = input.trim();

  if (trimmedInput.length < MIN_INPUT_LENGTH) {
    return `Beskriv konseptet med minst ${MIN_INPUT_LENGTH} tegn for å få en god refleksjon.`;
  }

  if (trimmedInput.length > MAX_INPUT_LENGTH) {
    return `Konseptbeskrivelsen kan ikke være lengre enn ${MAX_INPUT_LENGTH} tegn.`;
  }

  return null;
}

export default function KonseptSpeil() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isExampleAnimating, setIsExampleAnimating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Character count thresholds
  const charCountWarning = MAX_INPUT_LENGTH * 0.9;
  const charCountDanger = MAX_INPUT_LENGTH * 0.975;

  // Dispatch events for mobile CTA sync
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('konseptspeil:inputChange', {
      detail: {
        length: input.trim().length,
        isLoading: loading,
        hasResult: !!result,
      }
    }));
  }, [input, loading, result]);

  // Listen for mobile submit trigger
  useEffect(() => {
    const handleMobileSubmit = () => {
      handleSubmit();
    };
    window.addEventListener('konseptspeil:submit', handleMobileSubmit);
    return () => window.removeEventListener('konseptspeil:submit', handleMobileSubmit);
  }, [input, loading]);

  /**
   * Auto-resize textarea to fit content
   */
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

  /**
   * Handle paste events to decode URL-encoded text
   */
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

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleFillExample = () => {
    trackClick('konseptspeil_example');
    setIsExampleAnimating(true);
    setInput(EXAMPLE_KONSEPT);
    setError(null);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);

    setTimeout(() => {
      setIsExampleAnimating(false);
    }, 600);
  };

  const handleClearResult = () => {
    trackClick('konseptspeil_reset');
    setResult(null);
    setError(null);
    setInput('');
  };

  const handleSubmit = async () => {
    if (loading) return;

    const validationError = validateKonseptInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    trackClick('konseptspeil_submit');

    setLoading(true);
    setIsStreaming(true);
    setError(null);
    setResult('');

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    await speileKonseptStreaming(
      input.trim(),
      (chunk) => {
        setResult((prev) => (prev || '') + chunk);
      },
      () => {
        setLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      (errorMsg) => {
        setError(errorMsg);
        setLoading(false);
        setIsStreaming(false);
        setResult(null);
        abortControllerRef.current = null;
      },
      abortControllerRef.current.signal
    );
  };

  const isButtonEnabled = input.trim().length >= 50 && !loading;

  return (
    <div className="space-y-8" aria-busy={loading}>
      {/* Input section */}
      <section>
        <label htmlFor="konsept-input" className="block text-lg font-semibold text-neutral-800 mb-3">
          Beskriv konseptet ditt
        </label>

        <div className="relative">
          <textarea
            ref={textareaRef}
            id="konsept-input"
            value={input}
            onChange={(e) => {
              let newValue = e.target.value;
              if (isUrlEncoded(newValue)) {
                newValue = safeDecodeURIComponent(newValue);
              }
              setInput(newValue);
              if (error) setError(null);
            }}
            onPaste={handlePaste}
            placeholder="Hva handler ideen om? Hvem er det for? Hvordan tenker du å løse det?"
            maxLength={MAX_INPUT_LENGTH}
            aria-describedby={error ? 'konsept-error konsept-help' : 'konsept-help'}
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
              Fyll inn eksempel
            </button>
          )}
        </div>

        {/* Trust signals - high contrast, always visible */}
        <div id="konsept-help" className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-full text-sm font-medium text-neutral-700">
            <span aria-hidden="true">🔒</span>
            <span>Lagres ikke</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-full text-sm font-medium text-neutral-700">
            <span aria-hidden="true">⏱</span>
            <span>~30 sekunder</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-full text-sm font-medium text-neutral-700">
            <span aria-hidden="true">💡</span>
            <span>Refleksjon, ikke dom</span>
          </span>
          <span className="ml-auto text-sm font-medium text-neutral-600">
            <span className={cn(
              input.length > charCountDanger && 'text-feedback-error',
              input.length > charCountWarning && input.length <= charCountDanger && 'text-feedback-warning'
            )}>
              {input.length}
            </span>
            <span className="text-neutral-500"> / {MAX_INPUT_LENGTH}</span>
          </span>
        </div>

        {/* Helper text - readable contrast */}
        <p className="mt-3 text-base text-neutral-600">
          Skriv fritt – uferdige tanker og stikkord fungerer fint.
        </p>
      </section>

      {/* Action buttons - desktop only (mobile uses sticky bar) */}
      <div className="hidden md:block space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isButtonEnabled}
            aria-busy={loading}
            className={cn(
              'inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2',
              loading
                ? 'bg-brand-navy/80 text-white cursor-wait'
                : isButtonEnabled
                  ? 'bg-brand-navy text-white hover:bg-brand-navy/90 hover:scale-[1.02] active:scale-100 shadow-lg hover:shadow-xl'
                  : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <SpinnerIcon className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                <span>Genererer refleksjon...</span>
              </>
            ) : (
              <>
                <span>Få min refleksjon</span>
                <svg className="ml-2 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {result && !loading && (
            <button
              type="button"
              onClick={handleClearResult}
              className="inline-flex items-center justify-center px-5 py-3 text-base font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
            >
              Start på nytt
            </button>
          )}
        </div>

        {error && (
          <div id="konsept-error" role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <ErrorIcon className="w-5 h-5 text-feedback-error flex-shrink-0 mt-0.5" />
            <p className="text-base text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Mobile: Show error inline */}
      <div className="md:hidden">
        {error && (
          <div id="konsept-error" role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <ErrorIcon className="w-5 h-5 text-feedback-error flex-shrink-0 mt-0.5" />
            <p className="text-base text-red-800">{error}</p>
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
        {loading && !result && (
          <div className="p-6 bg-white border-2 border-brand-cyan/30 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-cyan-lightest flex items-center justify-center">
                <SpinnerIcon className="animate-spin h-5 w-5 text-brand-cyan-darker" />
              </div>
              <div>
                <p className="text-base font-semibold text-neutral-800">Genererer refleksjon...</p>
                <p className="text-sm text-neutral-600">Dette tar vanligvis 15-30 sekunder</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="p-6 bg-white border-2 border-neutral-200 rounded-xl shadow-sm">
            <KonseptSpeilResultDisplay
              result={result}
              isStreaming={isStreaming}
              onRetry={handleSubmit}
            />
            {/* Mobile: Show reset button here */}
            {!loading && (
              <div className="mt-6 pt-6 border-t border-neutral-200 md:hidden">
                <button
                  type="button"
                  onClick={handleClearResult}
                  className="w-full inline-flex items-center justify-center px-4 py-3 text-base font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
                >
                  Skriv nytt konsept
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* "Hva du får" section - moved below input */}
      {!result && (
        <section id="hva-du-far" className="pt-6 border-t border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-800 mb-4">Hva du får tilbake</h2>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-neutral-200">
              <span className="text-brand-cyan-darker text-lg" aria-hidden="true">→</span>
              <div>
                <p className="font-semibold text-neutral-800">Antakelser du lener deg på</p>
                <p className="text-sm text-neutral-600">Hva tar du for gitt uten å ha validert det?</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-neutral-200">
              <span className="text-brand-cyan-darker text-lg" aria-hidden="true">→</span>
              <div>
                <p className="font-semibold text-neutral-800">Uklarheter å utforske</p>
                <p className="text-sm text-neutral-600">Hva kan skape friksjon eller forvirring?</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-neutral-200">
              <span className="text-brand-cyan-darker text-lg" aria-hidden="true">→</span>
              <div>
                <p className="font-semibold text-neutral-800">Naturlige neste steg</p>
                <p className="text-sm text-neutral-600">Hva kan være lurt å undersøke først?</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trygghet og personvern */}
      <section id="trygghet" className="pt-6 border-t border-neutral-200">
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
          className="w-full flex items-center justify-between py-3 text-left focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded-lg"
        >
          <span className="text-lg font-bold text-neutral-800">Trygghet og personvern</span>
          <ChevronRightIcon className={cn('w-5 h-5 text-neutral-600 transition-transform', isPrivacyOpen && 'rotate-90')} />
        </button>

        {isPrivacyOpen && (
          <div
            id="privacy-content"
            className="mt-4 p-5 bg-white rounded-xl border border-neutral-200 space-y-4"
          >
            <div>
              <h3 className="font-semibold text-neutral-800 mb-1">Hvordan fungerer det?</h3>
              <p className="text-base text-neutral-600">
                Refleksjonen bygger på prinsipper for produktutvikling og tidlig fase-tenkning.
                En AI-modell (Claude fra Anthropic) speiler konseptbeskrivelsen din strukturert.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800 mb-1">Hva skjer med teksten?</h3>
              <p className="text-base text-neutral-600">
                Konseptbeskrivelsen sendes til Anthropics API for å generere refleksjonen.
                Vi lagrer ikke innholdet, og det brukes ikke til å trene AI-modeller.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800 mb-1">Er det trygt?</h3>
              <p className="text-base text-neutral-600">
                Ja. Du trenger ikke logge inn, og vi samler ikke personopplysninger.
                For sensitive konsepter anbefaler vi å anonymisere innholdet først.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
