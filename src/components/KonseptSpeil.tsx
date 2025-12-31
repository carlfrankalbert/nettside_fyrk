import { useState, useRef, useEffect, useCallback } from 'react';
import { speileKonseptStreaming } from '../services/konseptspeil-service';
import KonseptSpeilResultDisplay from './KonseptSpeilResultDisplay';
import { ErrorIcon, SpinnerIcon } from './ui/Icon';
import { PrivacyAccordion, type PrivacyContent } from './ui/PrivacyAccordion';
import { InfoBox } from './ui/InfoBox';
import { cn } from '../utils/classes';
import { INPUT_VALIDATION } from '../utils/constants';
import { trackClick } from '../utils/tracking';
import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea';
import { useUrlDecodePaste } from '../hooks/useUrlDecodePaste';

const EXAMPLE_KONSEPT = `Vi vil lage en app som hjelper produktledere med å holde oversikt over discovery-arbeidet sitt.

Idéen er at man kan logge samtaler med brukere, tagge dem med temaer, og se mønstre over tid.

Vi tror dette er nyttig fordi mange produktledere sliter med å huske hva de har lært fra tidligere samtaler når de skal prioritere.

Målgruppen er produktledere i mellomstore tech-selskaper.`;

const INFO_ITEMS = [
  'Beskriv et produktkonsept, en idé eller et initiativ',
  'Få refleksjon på modenhet, antakelser og neste steg',
  'Ingen lagring · Designet for tidlig fase',
];

const PRIVACY_CONTENT: PrivacyContent = {
  howItWorks:
    'Refleksjonen genereres av Claude (Anthropic), en AI-modell som analyserer konseptbeskrivelsen din og speiler tilbake observasjoner basert på etablerte prinsipper for produktutvikling.',
  dataHandling:
    'Konseptbeskrivelsen sendes til Anthropics API for å generere refleksjonen. Vi lagrer ikke innholdet du sender inn, og det brukes ikke til å trene AI-modeller.',
  safety:
    'Ja. Du trenger ikke logge inn, og vi samler ikke inn personopplysninger. Hvis du jobber med sensitive konsepter, anbefaler vi å anonymisere innholdet først.',
  additionalInfo: {
    title: 'Hva er dette designet for?',
    content:
      'Konseptspeilet er et refleksjonsverktøy – ikke en evaluering. Det hjelper deg å se konseptet ditt tydeligere, identifisere antakelser, og tenke gjennom hva som kan være verdifullt å utforske videre.',
  },
};

// Input validation constants
const MIN_INPUT_LENGTH = INPUT_VALIDATION.MIN_LENGTH;
const MAX_INPUT_LENGTH = INPUT_VALIDATION.MAX_LENGTH;

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

  // Use custom hooks for textarea behavior
  const { textareaRef } = useAutoResizeTextarea(input);

  const clearError = useCallback(() => {
    if (error) setError(null);
  }, [error]);

  const { handlePaste, handleChange } = useUrlDecodePaste({
    value: input,
    onChange: setInput,
    onInputChange: clearError,
    textareaRef,
  });

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

  const handleTogglePrivacy = () => {
    if (!isPrivacyOpen) {
      trackClick('konseptspeil_privacy_toggle');
    }
    setIsPrivacyOpen(!isPrivacyOpen);
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
      <InfoBox items={INFO_ITEMS} />

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
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder="Beskriv produktkonseptet, idéen eller initiativet du jobber med.

Inkluder gjerne:
- Hva problemet eller muligheten handler om
- Hvem som har dette problemet
- Hvordan du tenker å løse det
- Hva du allerede vet eller har lært

Uferdige tanker er velkommen – dette er et refleksjonsverktøy."
          maxLength={MAX_INPUT_LENGTH}
          aria-describedby={
            error ? 'konsept-error konsept-help konsept-char-count' : 'konsept-help konsept-char-count'
          }
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 rounded-lg',
            'resize-none min-h-[280px] overflow-hidden placeholder:text-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'aria-[invalid=true]:border-feedback-error transition-all duration-300',
            isExampleAnimating
              ? 'border-brand-cyan bg-brand-cyan-lightest/50 ring-2 ring-brand-cyan shadow-brand-cyan scale-[1.01]'
              : 'border-neutral-300'
          )}
          disabled={loading}
        />
        <div id="konsept-char-count" className="mt-1 text-xs text-neutral-500 text-right">
          <span className={cn(input.length > MAX_INPUT_LENGTH * 0.9 && 'text-feedback-warning')}>
            {input.length}
          </span>{' '}
          / {MAX_INPUT_LENGTH} tegn
        </div>
      </div>

      {/* Action buttons */}
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
            <KonseptSpeilResultDisplay result={result} isStreaming={isStreaming} onRetry={handleSubmit} />
          </div>
        )}
      </div>

      <PrivacyAccordion
        isOpen={isPrivacyOpen}
        onToggle={handleTogglePrivacy}
        description="Konseptbeskrivelsen brukes kun til å generere refleksjonen."
        content={PRIVACY_CONTENT}
      />
    </div>
  );
}
