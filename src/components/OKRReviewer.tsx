import { useState } from 'react';
import { reviewOKR } from '../services/okr-service';

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

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError('Lim inn OKR først.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const response = await reviewOKR(input.trim());

    if (response.success) {
      setResult(response.output);
    } else {
      setError(response.error);
    }

    setLoading(false);
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
          {loading ? 'Vurderer...' : 'Analyser OKR'}
        </button>

        {error && (
          <p className="text-feedback-error text-sm">{error}</p>
        )}
      </div>

      {result && (
        <div className="mt-8 p-6 bg-white border border-neutral-200 rounded-lg">
          <div className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
