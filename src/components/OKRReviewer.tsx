import { useState, useRef, useEffect } from 'react';
import { reviewOKRStreaming } from '../services/okr-service';
import OKRResultDisplay from './OKRResultDisplay';

const EXAMPLE_OKR = `Objective:
Gjøre det enkelt og trygt for brukere å komme i gang med produktet.

Key Results:
1. Øke aktiveringsraten (fullført onboarding) fra 45 % til 70 %.
2. Redusere tid til første verdi fra 10 minutter til under 3 minutter.
3. Redusere onboarding-relaterte supporthenvendelser med 50 %.`;

interface OKRReviewerProps {
  onResultGenerated?: (hasResult: boolean) => void;
}

export default function OKRReviewer({ onResultGenerated }: OKRReviewerProps) {
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

  // Notify parent when result state changes
  useEffect(() => {
    onResultGenerated?.(!!result);
  }, [result, onResultGenerated]);

  const handleFillExample = () => {
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
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError('Lim inn minst ett Objective og Key Result for å få en vurdering.');
      return;
    }

    // Prevent duplicate submissions
    if (loading) return;

    setLoading(true);
    setIsStreaming(true);
    setError(null);
    setResult('');

    // Create abort controller for cancellation
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
      }
    );
  };

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* Value proposition - moved above input for better visibility */}
      <div className="p-5 bg-neutral-100 rounded-lg">
        <p className="font-medium text-neutral-700 mb-3">På under ett minutt får du:</p>
        <ul className="space-y-2 text-neutral-700" role="list">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-feedback-success flex-shrink-0 mt-0.5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Samlet vurdering av OKR-kvalitet</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-feedback-success flex-shrink-0 mt-0.5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Hva som fungerer og bør forbedres</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-feedback-success flex-shrink-0 mt-0.5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Forslag til mer outcome-baserte OKR-er</span>
          </li>
        </ul>
      </div>

      {/* Input section with persistent instructions */}
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
            Vis eksempel
          </button>
        </div>

        {/* Persistent format instructions (visible while typing) */}
        <div className="p-3 mb-3 bg-neutral-50 border border-neutral-200 rounded-lg">
          <p className="text-sm text-neutral-600 mb-2 font-medium">Format:</p>
          <ul className="text-sm text-neutral-500 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-neutral-400 font-mono">1.</span>
              <span>Start med <strong className="text-neutral-600">Objective:</strong> etterfulgt av målet ditt</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-400 font-mono">2.</span>
              <span>Legg til <strong className="text-neutral-600">Key Results:</strong> med 1-5 målbare resultater</span>
            </li>
          </ul>
        </div>

        <textarea
          ref={textareaRef}
          id="okr-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Objective:
Ditt mål her...

Key Results:
1. Første målbare resultat
2. Andre målbare resultat
3. Tredje målbare resultat"
          rows={10}
          aria-describedby={error ? 'okr-error okr-help' : 'okr-help'}
          aria-invalid={error ? 'true' : undefined}
          className={`w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 rounded-lg resize-y min-h-[280px] focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker placeholder:text-neutral-400 disabled:opacity-60 disabled:cursor-not-allowed aria-[invalid=true]:border-feedback-error transition-all duration-300 ${
            isExampleAnimating
              ? 'border-brand-cyan bg-brand-cyan-lightest/50 ring-2 ring-brand-cyan shadow-brand-cyan scale-[1.01]'
              : 'border-neutral-300'
          }`}
          disabled={loading}
        />
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
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
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
            <svg className="w-4 h-4 flex-shrink-0" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>

      <p className="text-sm text-neutral-500">
        Ingen lagring · Ingen pålogging
      </p>

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
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
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

      {/* AI og personvern accordion */}
      <div className="border-t border-neutral-200 pt-6">
        <p className="text-sm text-neutral-500 mb-3">
          OKR-ene du legger inn brukes kun til å generere vurderingen.
        </p>
        <button
          type="button"
          onClick={() => setIsPrivacyOpen(!isPrivacyOpen)}
          aria-expanded={isPrivacyOpen}
          aria-controls="privacy-content"
          className="flex items-center gap-2 text-sm text-brand-navy hover:text-brand-cyan-darker focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded py-2"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isPrivacyOpen ? 'rotate-90' : ''}`}
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
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
              OKR-settet ditt basert på etablerte prinsipper for god målsetting.
            </p>
            <p>
              <strong>Hva skjer med dataene?</strong><br />
              OKR-ene dine sendes til Anthropics API for å generere vurderingen.
              Vi lagrer ikke innholdet du sender inn, og det brukes ikke til å trene AI-modeller.
            </p>
            <p>
              <strong>Er det trygt?</strong><br />
              Ja. Du trenger ikke logge inn, og vi samler ikke inn personopplysninger.
              Hvis du jobber med sensitive mål, anbefaler vi å anonymisere innholdet først.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
