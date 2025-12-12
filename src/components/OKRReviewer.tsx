import { useState, useRef, useEffect } from 'react';
import { reviewOKRStreaming } from '../services/okr-service';

const EXAMPLE_OKR = `Objective:
Gjøre det enkelt og trygt for brukere å komme i gang med produktet.

Key Results:
1. Øke aktiveringsraten (fullført onboarding) fra 45 % til 70 %.
2. Redusere tid til første verdi fra 10 minutter til under 3 minutter.
3. Redusere onboarding-relaterte supporthenvendelser med 50 %.`;

export default function OKRReviewer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to result when streaming starts
  useEffect(() => {
    if (isStreaming && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isStreaming]);

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError('Lim inn OKR først.');
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

  const handleUseExample = () => {
    setInput(EXAMPLE_OKR);
    setShowExample(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <textarea
          id="okr-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Lim inn Objective og tilhørende Key Results her."
          rows={8}
          className="w-full px-4 py-3 text-base text-neutral-700 bg-white border border-neutral-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan placeholder:text-neutral-400 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setShowExample(!showExample)}
          className="mt-2 text-sm text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2"
        >
          {showExample ? 'Skjul eksempel' : 'Vis eksempel'}
        </button>

        {showExample && (
          <div className="mt-3 p-4 bg-neutral-100 border border-neutral-200 rounded-lg">
            <pre className="text-sm text-neutral-600 whitespace-pre-wrap font-sans">{EXAMPLE_OKR}</pre>
            <button
              type="button"
              onClick={handleUseExample}
              className="mt-3 text-sm text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2"
            >
              Bruk dette eksempelet
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-brand-navy rounded-lg hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Vurderer...
              </>
            ) : (
              'Sjekk OKR-settet ditt'
            )}
          </button>

          {error && (
            <p className="text-feedback-error text-sm">{error}</p>
          )}
        </div>
        <p className="text-xs text-neutral-400">Ingen lagring · Ingen pålogging</p>
      </div>

      {(result || isStreaming) && (
        <div
          ref={resultRef}
          className="mt-8 p-6 bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm"
        >
          <h3 className="text-sm font-semibold text-brand-navy mb-4 uppercase tracking-wide">
            Vurdering
          </h3>
          <div className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
            {result}
            {isStreaming && !result && (
              <span className="inline-block w-2 h-4 ml-1 bg-brand-cyan animate-pulse"></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
