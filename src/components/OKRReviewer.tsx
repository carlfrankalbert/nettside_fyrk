import { useState, useRef, useEffect, useCallback } from 'react';
import { reviewOKRStreaming } from '../services/okr-service';
import OKRResultDisplay from './OKRResultDisplay';
import { CheckIcon, ErrorIcon, SpinnerIcon, ChevronRightIcon } from './ui/Icon';
import { cn } from '../utils/classes';
import { INPUT_VALIDATION } from '../utils/constants';
import { trackClick, logEvent } from '../utils/tracking';

const EXAMPLE_OKR = `Objective:
Gjøre det enkelt og trygt for brukere å komme i gang med produktet.

Key Results:
1. Øke aktiveringsraten (fullført onboarding) fra 45 % til 70 %.
2. Redusere tid til første verdi fra 10 minutter til under 3 minutter.
3. Redusere onboarding-relaterte supporthenvendelser med 50 %.`;

/**
 * Check if text appears to be URL-encoded
 * Looks for common URL encoding patterns like %20 (space), %0A (newline), etc.
 */
function isUrlEncoded(text: string): boolean {
  // Check for URL-encoded patterns: %XX where XX is hex
  const urlEncodedPattern = /%[0-9A-Fa-f]{2}/;
  if (!urlEncodedPattern.test(text)) return false;

  // Additional check: common URL-encoded characters that shouldn't appear in normal OKR text
  const commonEncodings = ['%20', '%0A', '%0D', '%C3']; // space, newline, carriage return, UTF-8 start
  return commonEncodings.some(enc => text.includes(enc));
}

/**
 * Safely decode URL-encoded text
 * Falls back to original text if decoding fails
 */
function safeDecodeURIComponent(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    // If decoding fails, return original text
    return text;
  }
}

// Input validation constants (from shared config)
const MIN_INPUT_LENGTH = INPUT_VALIDATION.MIN_LENGTH;
const MAX_INPUT_LENGTH = INPUT_VALIDATION.MAX_LENGTH;

/**
 * Validates OKR input for basic structure and length
 * Returns error message if invalid, null if valid
 */
function validateOKRInput(input: string): string | null {
  const trimmedInput = input.trim();

  // Check minimum length
  if (trimmedInput.length < MIN_INPUT_LENGTH) {
    return `Input må være minst ${MIN_INPUT_LENGTH} tegn. Skriv inn et komplett OKR-sett.`;
  }

  // Check maximum length
  if (trimmedInput.length > MAX_INPUT_LENGTH) {
    return `Input kan ikke være lengre enn ${MAX_INPUT_LENGTH} tegn. Forkort OKR-settet ditt.`;
  }

  // Check for OKR-like content (case-insensitive)
  const lowerInput = trimmedInput.toLowerCase();
  const hasObjective = lowerInput.includes('objective') || lowerInput.includes('mål');
  const hasKeyResult = lowerInput.includes('key result') || lowerInput.includes('kr') ||
                       lowerInput.includes('nøkkelresultat') || /\d+\./.test(trimmedInput);

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const checkStartTimeRef = useRef<number>(0);

  /**
   * Auto-resize textarea to fit content
   * Resets height to auto first to properly calculate scrollHeight
   */
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight to fit all content
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  // Auto-resize textarea when input changes
  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

  // Dispatch events for mobile CTA sync
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('okr:inputChange', {
      detail: {
        length: input.trim().length,
        isLoading: loading,
        hasResult: !!result,
      }
    }));
  }, [input, loading, result]);

  /**
   * Handle paste events to decode URL-encoded text
   * This fixes an iOS Safari bug where copied text sometimes gets URL-encoded
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text/plain');

    if (isUrlEncoded(pastedText)) {
      e.preventDefault();
      const decodedText = safeDecodeURIComponent(pastedText);

      // Get current cursor position
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert decoded text at cursor position
      const newValue = input.substring(0, start) + decodedText + input.substring(end);
      setInput(newValue);
      if (error) setError(null);

      // Reset cursor position after state update
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
    // Track button click
    trackClick('okr_example');

    // Trigger animation
    setIsExampleAnimating(true);
    setInput(EXAMPLE_OKR);
    setError(null);

    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);

    // Reset animation state after animation completes
    setTimeout(() => {
      setIsExampleAnimating(false);
    }, 600);
  };

  const handleClearResult = () => {
    // Track button click
    trackClick('okr_reset');

    setResult(null);
    setError(null);
    setInput('');
  };

  const handleSubmit = useCallback(async () => {
    // Prevent duplicate submissions
    if (loading) return;

    // Validate input
    const validationError = validateOKRInput(input);
    if (validationError) {
      setError(validationError);
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

    // Cancel any existing request and create new abort controller
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    await reviewOKRStreaming(
      input.trim(),
      (chunk) => {
        // Append streaming chunk
        setResult((prev) => (prev || '') + chunk);
      },
      () => {
        // Streaming complete
        setLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;

        // Track successful completion with metadata
        const processingTimeMs = Date.now() - checkStartTimeRef.current;
        logEvent('check_success', {
          charCount: input.trim().length,
          processingTimeMs,
        });

        // Scroll to result
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      (errorMsg) => {
        // Error occurred
        setError(errorMsg);
        setLoading(false);
        setIsStreaming(false);
        setResult(null);
        abortControllerRef.current = null;
      },
      abortControllerRef.current.signal
    );
  }, [input, loading]);

  // Listen for mobile submit trigger
  useEffect(() => {
    const handleMobileSubmit = () => {
      handleSubmit();
    };
    window.addEventListener('okr:submit', handleMobileSubmit);
    return () => window.removeEventListener('okr:submit', handleMobileSubmit);
  }, [handleSubmit]);

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Compact info box */}
      <div className="p-4 bg-neutral-100 rounded-lg">
        <ul className="space-y-1.5 text-sm text-neutral-700" role="list">
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-feedback-success flex-shrink-0 mt-0.5" />
            <span>Lim inn <strong>Objective</strong> + <strong>Key Results</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-feedback-success flex-shrink-0 mt-0.5" />
            <span>Få vurdering, styrker og forbedringsforslag</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-feedback-success flex-shrink-0 mt-0.5" />
            <span>Under ett minutt · Ingen lagring</span>
          </li>
        </ul>
      </div>

      {/* Input section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="okr-input"
            className="block text-base font-medium text-neutral-700"
          >
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
          onChange={(e) => {
            let newValue = e.target.value;
            // Fallback: decode URL-encoded text on change
            // This handles cases where paste event prevention doesn't work (iOS Safari/Chrome)
            if (isUrlEncoded(newValue)) {
              newValue = safeDecodeURIComponent(newValue);
            }
            setInput(newValue);
            if (error) setError(null);
          }}
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
          </span>
          {' / '}{MAX_INPUT_LENGTH} tegn
        </div>
      </div>

      {/* Action buttons - desktop only (mobile uses sticky bar) */}
      <div className="hidden md:flex md:flex-row md:items-center gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          aria-busy={loading}
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-brand-navy rounded-lg hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
          >
            Nullstill
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
            {/* Mobile: Show reset button inside result area */}
            {!loading && (
              <div className="mt-6 pt-6 border-t border-neutral-200 md:hidden">
                <button
                  type="button"
                  onClick={handleClearResult}
                  className="w-full inline-flex items-center justify-center px-4 py-3 text-base font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
                >
                  Start på nytt
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI og personvern accordion */}
      <div className="border-t border-neutral-200 pt-6">
        <p className="text-sm text-neutral-500 mb-3">
          OKR-ene du legger inn brukes kun til å generere vurderingen. Unngå å lime inn konfidensiell eller sensitiv informasjon.
        </p>
        <button
          type="button"
          onClick={() => {
            if (!isPrivacyOpen) {
              // Only track when opening (not closing)
              trackClick('okr_privacy_toggle');
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
              Vurderingen genereres av Claude (Anthropic), en AI-modell som analyserer
              OKR-settet ditt basert på etablerte prinsipper for god målsetting. AI-output kan være unøyaktig eller ufullstendig – bruk din egen vurdering.
            </p>
            <p>
              <strong>Hva skjer med dataene?</strong><br />
              OKR-ene dine sendes til Anthropics API for å generere vurderingen.
              Vi lagrer ikke innholdet du sender inn, og det brukes ikke til å trene AI-modeller. Vi bruker anonymisert bruksstatistikk for å forbedre tjenesten.
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
