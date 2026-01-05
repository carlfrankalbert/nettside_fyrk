import { useState, useRef, useEffect, useCallback } from 'react';
import { speileKonseptStreaming } from '../services/konseptspeil-service';
import KonseptSpeilResultDisplay from './KonseptSpeilResultDisplay';
import { CheckIcon, ErrorIcon, SpinnerIcon, ChevronRightIcon } from './ui/Icon';
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
      {/* Value box */}
      <div className="p-4 bg-neutral-100 rounded-lg">
        <h2 className="text-base font-semibold text-brand-navy mb-3">Hva får du igjen?</h2>
        <ul className="space-y-2.5 text-sm text-neutral-700" role="list">
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-feedback-success flex-shrink-0 mt-0.5" />
            <span><strong className="text-neutral-800">Klarhet</strong> – En tydelig refleksjon på hva som er klart, uklart og antatt.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-feedback-success flex-shrink-0 mt-0.5" />
            <span><strong className="text-neutral-800">Innsikt</strong> – Oversikt over hvilke antakelser du lener deg på.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-feedback-success flex-shrink-0 mt-0.5" />
            <span><strong className="text-neutral-800">Fremdrift</strong> – Forslag til naturlige neste steg å utforske.</span>
          </li>
        </ul>
        <p className="mt-3 text-sm text-neutral-500 italic">Dette er et speil – ikke en dom. Du beholder eierskap til ideen.</p>
      </div>

      {/* Input section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="konsept-input" className="block text-base font-medium text-neutral-700">
            Beskriv konseptet ditt
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
          placeholder="Forklar ideen slik du ville gjort til en kollega på et par minutter."
          maxLength={MAX_INPUT_LENGTH}
          aria-describedby={error ? 'konsept-error konsept-help konsept-char-count' : 'konsept-help konsept-char-count'}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 rounded-lg',
            'resize-none min-h-[200px] overflow-hidden placeholder:text-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'aria-[invalid=true]:border-feedback-error transition-all duration-300',
            isExampleAnimating
              ? 'border-brand-cyan bg-brand-cyan-lightest/50 ring-2 ring-brand-cyan shadow-brand-cyan scale-[1.01]'
              : 'border-neutral-300'
          )}
          disabled={loading}
        />
        <div id="konsept-help" className="mt-3 text-sm text-neutral-500 space-y-2">
          <p>Uferdige tanker, stikkord og halve setninger er mer enn nok.</p>
          <p className="text-neutral-400">
            Du trenger ikke dekke alt – dette er bare støtte om du står fast:
          </p>
          <ul className="text-neutral-400 space-y-0.5 ml-4">
            <li>• Hva problemet eller muligheten handler om</li>
            <li>• Hvem som har dette problemet</li>
            <li>• Hvordan du tenker å løse det</li>
            <li>• Hva du allerede vet – og hva du antar</li>
          </ul>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span aria-hidden="true">🔒</span>
            <span>Teksten brukes kun til å generere refleksjonen. Ingenting lagres.</span>
          </span>
          <span id="konsept-char-count">
            <span className={cn(input.length > MAX_INPUT_LENGTH * 0.9 && 'text-feedback-warning')}>
              {input.length}
            </span>
            {' / '}
            {MAX_INPUT_LENGTH}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            aria-busy={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-brand-navy rounded-lg hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                <span>Speiler konseptet...</span>
              </>
            ) : (
              'Speile konseptet'
            )}
          </button>

          {result && !loading && (
            <button
              type="button"
              onClick={handleClearResult}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
            >
              Nullstill
            </button>
          )}

          {error && (
            <p id="konsept-error" role="alert" className="text-feedback-error text-sm flex items-center gap-2">
              <ErrorIcon className="w-4 h-4 flex-shrink-0" />
              {error}
            </p>
          )}
        </div>
        {!loading && !result && (
          <p className="text-xs text-neutral-500">Tar vanligvis under 1 minutt.</p>
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
