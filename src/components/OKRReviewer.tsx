import { useState, useRef } from 'react';
import { reviewOKRStreaming } from '../services/okr-service';

const PLACEHOLDER = `Objective:
Øke bruken av mobilbanken blant småbedrifter i Norge.

Key Results:
1. Øke andelen aktive brukere fra 20 % til 35 % innen Q4.
2. Redusere tiden det tar å gjennomføre en betaling med 30 %.
3. Minst 70 % av brukertestene skal gi score 4 eller bedre.`;

export default function OKRReviewer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="okr-input"
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          Lim inn OKR-settet ditt
        </label>
        <textarea
          id="okr-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={10}
          className="w-full px-4 py-3 text-base text-neutral-700 bg-white border border-neutral-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan placeholder:text-neutral-500 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        />
      </div>

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
            'Analyser OKR'
          )}
        </button>

        {error && (
          <p className="text-feedback-error text-sm">{error}</p>
        )}
      </div>

      {(result || isStreaming) && (
        <div className="mt-8 p-6 bg-white border border-neutral-200 rounded-lg">
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
