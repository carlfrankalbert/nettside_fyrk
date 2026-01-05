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
    return `Beskriv konseptet med minst ${MIN_INPUT_LENGTH} tegn.`;
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
  const charCountWarning = MAX_INPUT_LENGTH * 0.9; // 1800
  const charCountDanger = MAX_INPUT_LENGTH * 0.975; // 1950

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

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Input section */}
      <div>
        <label htmlFor="konsept-input" className="block text-base font-medium text-neutral-700 mb-2">
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
            maxLength={MAX_INPUT_LENGTH}
            aria-describedby={error ? 'konsept-error konsept-help konsept-char-count' : 'konsept-help konsept-char-count'}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 rounded-lg',
              'resize-none min-h-[180px] overflow-hidden',
              'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'aria-[invalid=true]:border-feedback-error transition-all duration-300',
              isExampleAnimating
                ? 'border-brand-cyan bg-brand-cyan-lightest/50 ring-2 ring-brand-cyan shadow-brand-cyan scale-[1.01]'
                : 'border-neutral-300'
            )}
            disabled={loading}
          />
          {!input && !loading && (
            <button
              type="button"
              onClick={handleFillExample}
              className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-navy bg-brand-cyan-lightest/70 hover:bg-brand-cyan-lightest border border-brand-cyan/30 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Prøv med eksempel
            </button>
          )}
        </div>
        {/* Trust signals directly under input - reduces doubt before action */}
        <div id="konsept-help" className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span aria-hidden="true">🔒</span>
            <span>Lagres ikke</span>
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden="true">⏱</span>
            <span>Ca. 30 sekunder</span>
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden="true">💡</span>
            <span>Refleksjon, ikke dom</span>
          </span>
          <span id="konsept-char-count" className="ml-auto">
            <span className={cn(
              input.length > charCountDanger && 'text-feedback-error font-medium',
              input.length > charCountWarning && input.length <= charCountDanger && 'text-feedback-warning'
            )}>
              {input.length}
            </span>
            {' / '}
            {MAX_INPUT_LENGTH}
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          Skriv fritt – uferdige tanker og stikkord fungerer fint.
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || input.trim().length < 50}
            aria-busy={loading}
            className={cn(
              'w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2',
              loading
                ? 'bg-brand-navy/80 text-white cursor-wait'
                : input.trim().length >= 50
                  ? 'bg-brand-navy text-white hover:bg-brand-navy/90 hover:scale-[1.02] active:scale-100'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                <span>Genererer refleksjon...</span>
              </>
            ) : (
              <>
                <span>Få min refleksjon</span>
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {result && !loading && (
            <button
              type="button"
              onClick={handleClearResult}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
            >
              Start på nytt
            </button>
          )}
        </div>

        {error && (
          <p id="konsept-error" role="alert" className="text-feedback-error text-sm flex items-center gap-2">
            <ErrorIcon className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
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
          <div className="mt-8 p-6 bg-white border-2 border-neutral-200 rounded-lg">
            <div className="flex items-center gap-3 text-neutral-500">
              <SpinnerIcon className="animate-spin h-5 w-5" />
              <span>Speiler konseptet ditt – dette tar vanligvis 10-15 sekunder...</span>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 p-6 bg-white border-2 border-neutral-200 rounded-lg shadow-sm">
            <KonseptSpeilResultDisplay
              result={result}
              isStreaming={isStreaming}
              onRetry={handleSubmit}
            />
          </div>
        )}
      </div>

      {/* AI og personvern accordion */}
      <div className="border-t border-neutral-200 pt-6">
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
              <strong>Hvordan fungerer det?</strong>
              <br />
              Refleksjonen bygger på etablerte prinsipper for produktutvikling og tidlig fase-tenkning.
              En AI-modell (Claude fra Anthropic) brukes til å speile konseptbeskrivelsen din strukturert
              og gi deg observasjoner tilbake.
            </p>
            <p>
              <strong>Hva skjer med dataene?</strong>
              <br />
              Konseptbeskrivelsen sendes til Anthropics API for å generere refleksjonen. Vi
              lagrer ikke innholdet du sender inn, og det brukes ikke til å trene AI-modeller.
            </p>
            <p>
              <strong>Er det trygt?</strong>
              <br />
              Ja. Du trenger ikke logge inn, og vi samler ikke inn personopplysninger. Hvis du
              jobber med sensitive konsepter, anbefaler vi å anonymisere innholdet først.
            </p>
            <p>
              <strong>Hva er dette designet for?</strong>
              <br />
              Konseptspeilet er et refleksjonsverktøy – ikke en evaluering. Det hjelper deg å
              se konseptet ditt tydeligere, identifisere antakelser, og tenke gjennom hva som
              kan være verdifullt å utforske videre.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
