import { useState } from 'react';

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

    try {
      const response = await fetch('/api/okr-reviewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const data = await response.json();
      setResult(data.output);
    } catch (err) {
      setError('Noe gikk galt under vurderingen. Prøv igjen om litt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="okr-input"
          className="block text-sm font-medium text-[#374151] mb-2"
        >
          Lim inn OKR-settet ditt
        </label>
        <textarea
          id="okr-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={10}
          className="w-full px-4 py-3 text-base text-[#1F2937] bg-white border border-[#E5E7EB] rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-[#5AB9D3] focus:border-[#5AB9D3] placeholder:text-[#9CA3AF] disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-[#001F3F] rounded-lg hover:bg-[#001F3F]/90 focus:outline-none focus:ring-2 focus:ring-[#5AB9D3] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Vurderer...' : 'Analyser OKR'}
        </button>

        {error && (
          <p className="text-[#C41E3A] text-sm">{error}</p>
        )}
      </div>

      {result && (
        <div className="mt-8 p-6 bg-white border border-[#E5E7EB] rounded-lg">
          <div
            className="text-[#1F2937] leading-relaxed whitespace-pre-wrap"
          >
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
