import { useState, useRef, useEffect, useCallback } from 'react';
import { reviewOKRStreaming } from '../services/okr-service';
import OKRResultDisplay from './OKRResultDisplay';
import { CheckIcon, ErrorIcon, SpinnerIcon } from './ui/Icon';
import { PrivacyAccordion, type PrivacyContent } from './ui/PrivacyAccordion';
import { InfoBox } from './ui/InfoBox';
import { cn } from '../utils/classes';
import { INPUT_VALIDATION } from '../utils/constants';
import { trackClick, logEvent } from '../utils/tracking';
import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea';
import { useUrlDecodePaste } from '../hooks/useUrlDecodePaste';

const EXAMPLE_OKR = `Objective:
Gjøre det enkelt og trygt for brukere å komme i gang med produktet.

Key Results:
1. Øke aktiveringsraten (fullført onboarding) fra 45 % til 70 %.
2. Redusere tid til første verdi fra 10 minutter til under 3 minutter.
3. Redusere onboarding-relaterte supporthenvendelser med 50 %.`;

const INFO_ITEMS = [
  'Lim inn <strong>Objective</strong> + <strong>Key Results</strong>',
  'Få vurdering, styrker og forbedringsforslag',
  'Under ett minutt · Ingen lagring',
];

const PRIVACY_CONTENT: PrivacyContent = {
  howItWorks:
    'Vurderingen genereres av Claude (Anthropic), en AI-modell som analyserer OKR-settet ditt basert på etablerte prinsipper for god målsetting.',
  dataHandling:
    'OKR-ene dine sendes til Anthropics API for å generere vurderingen. Vi lagrer ikke innholdet du sender inn, og det brukes ikke til å trene AI-modeller.',
  safety:
    'Ja. Du trenger ikke logge inn, og vi samler ikke inn personopplysninger. Hvis du jobber med sensitive mål, anbefaler vi å anonymisere innholdet først.',
};

// Input validation constants
const MIN_INPUT_LENGTH = INPUT_VALIDATION.MIN_LENGTH;
const MAX_INPUT_LENGTH = INPUT_VALIDATION.MAX_LENGTH;

/**
 * Validates OKR input for basic structure and length
 * Returns error message if invalid, null if valid
 */
function validateOKRInput(input: string): string | null {
  const trimmedInput = input.trim();

  if (trimmedInput.length < MIN_INPUT_LENGTH) {
    return `Input må være minst ${MIN_INPUT_LENGTH} tegn. Skriv inn et komplett OKR-sett.`;
  }

  if (trimmedInput.length > MAX_INPUT_LENGTH) {
    return `Input kan ikke være lengre enn ${MAX_INPUT_LENGTH} tegn. Forkort OKR-settet ditt.`;
  }

  // Check for OKR-like content (case-insensitive)
  const lowerInput = trimmedInput.toLowerCase();
  const hasObjective = lowerInput.includes('objective') || lowerInput.includes('mål');
  const hasKeyResult =
    lowerInput.includes('key result') ||
    lowerInput.includes('kr') ||
    lowerInput.includes('nøkkelresultat') ||
    /\d+\./.test(trimmedInput);

  if (!hasObjective) {
    return 'Input ser ikke ut som en OKR. Inkluder minst ett "Objective" eller "Mål".';
  }

  if (!hasKeyResult) {
    return 'Input mangler Key Results. Legg til målbare resultater (f.eks. "1. Øke X fra Y til Z").';
  }

  return null;
}

export default function OKRReviewer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isExampleAnimating, setIsExampleAnimating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const checkStartTimeRef = useRef<number>(0);

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
    trackClick('okr_example');
    setIsExampleAnimating(true);
    setInput(EXAMPLE_OKR);
    setError(null);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);

    setTimeout(() => {
      setIsExampleAnimating(false);
    }, 600);
  };

  const handleClearResult = () => {
    trackClick('okr_reset');
    setResult(null);
    setError(null);
    setInput('');
  };

  const handleTogglePrivacy = () => {
    if (!isPrivacyOpen) {
      trackClick('okr_privacy_toggle');
    }
    setIsPrivacyOpen(!isPrivacyOpen);
  };

  const handleSubmit = async () => {
    if (loading) return;

    const validationError = validateOKRInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    trackClick('okr_submit');
    checkStartTimeRef.current = Date.now();

    setLoading(true);
    setIsStreaming(true);
    setError(null);
    setResult('');

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    await reviewOKRStreaming(
      input.trim(),
      (chunk) => {
        setResult((prev) => (prev || '') + chunk);
      },
      () => {
        setLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;

        const processingTimeMs = Date.now() - checkStartTimeRef.current;
        logEvent('check_success', {
          charCount: input.trim().length,
          processingTimeMs,
        });

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
          <label htmlFor="okr-input" className="block text-base font-medium text-neutral-700">
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
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder="Objective:
Ditt mål her...

Key Results:
1. Første målbare resultat
2. Andre målbare resultat
3. Tredje målbare resultat"
          maxLength={MAX_INPUT_LENGTH}
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
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
          >
            Nullstill
          </button>
        )}

        {error && (
          <p id="okr-error" role="alert" className="text-feedback-error text-sm flex items-center gap-2">
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
          </div>
        )}
      </div>

      <PrivacyAccordion
        isOpen={isPrivacyOpen}
        onToggle={handleTogglePrivacy}
        description="OKR-ene du legger inn brukes kun til å generere vurderingen."
        content={PRIVACY_CONTENT}
      />
    </div>
  );
}
