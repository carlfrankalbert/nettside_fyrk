import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '../utils/classes';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import {
  formatBeslutningsloggMarkdown,
  formatDateNorwegian,
  parseMultilineInput,
  validateBeslutning,
  BESLUTNINGSLOGG_VALIDATION,
  type BeslutningsloggData,
} from '../utils/beslutningslogg-formatter';

// ============================================================================
// Component
// ============================================================================

export default function Beslutningslogg() {
  // ---------------------------------------------------------------------------
  // Form State
  // ---------------------------------------------------------------------------
  const [beslutning, setBeslutning] = useState('');
  const [dato, setDato] = useState(() => new Date().toISOString().split('T')[0]);
  const [deltakere, setDeltakere] = useState('');
  const [kritiskeAntakelser, setKritiskeAntakelser] = useState('');
  const [akseptertUsikkerhet, setAkseptertUsikkerhet] = useState('');

  // ---------------------------------------------------------------------------
  // UI State
  // ---------------------------------------------------------------------------
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const beslutningRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  const { copied, copyToClipboard } = useCopyToClipboard(3000);

  // ---------------------------------------------------------------------------
  // Derived Values
  // ---------------------------------------------------------------------------
  const trimmedBeslutning = beslutning.trim();
  const charCount = trimmedBeslutning.length;
  const isValid = charCount >= BESLUTNINGSLOGG_VALIDATION.MIN_BESLUTNING_LENGTH;

  const formData: BeslutningsloggData = useMemo(() => ({
    beslutning: trimmedBeslutning,
    dato,
    deltakere: deltakere.trim() || undefined,
    kritiskeAntakelser: kritiskeAntakelser.trim() ? parseMultilineInput(kritiskeAntakelser) : undefined,
    akseptertUsikkerhet: akseptertUsikkerhet.trim() ? parseMultilineInput(akseptertUsikkerhet) : undefined,
  }), [trimmedBeslutning, dato, deltakere, kritiskeAntakelser, akseptertUsikkerhet]);

  const markdownOutput = useMemo(() => {
    if (!isValid) return '';
    return formatBeslutningsloggMarkdown(formData);
  }, [formData, isValid]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Dispatch events for mobile CTA sync
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('beslutningslogg:inputChange', {
      detail: {
        isValid,
        hasPreview: showPreview,
      }
    }));
  }, [isValid, showPreview]);

  // Listen for mobile submit trigger
  useEffect(() => {
    const handleMobileGenerate = () => {
      handleGenerate();
    };
    window.addEventListener('beslutningslogg:generate', handleMobileGenerate);
    return () => window.removeEventListener('beslutningslogg:generate', handleMobileGenerate);
  }, [beslutning]);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  const handleBeslutningChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= BESLUTNINGSLOGG_VALIDATION.MAX_BESLUTNING_LENGTH) {
      setBeslutning(value);
      if (validationError) setValidationError(null);
    }
  };

  const handleGenerate = () => {
    const error = validateBeslutning(beslutning);
    if (error) {
      setValidationError(error);
      beslutningRef.current?.focus();
      return;
    }
    setValidationError(null);
    setShowPreview(true);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCopy = async () => {
    await copyToClipboard(markdownOutput);
  };

  const handleEdit = () => {
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      beslutningRef.current?.focus();
    }, 300);
  };

  const handleReset = () => {
    setBeslutning('');
    setDato(new Date().toISOString().split('T')[0]);
    setDeltakere('');
    setKritiskeAntakelser('');
    setAkseptertUsikkerhet('');
    setValidationError(null);
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      beslutningRef.current?.focus();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isValid) {
        handleGenerate();
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Form section */}
      <section className="space-y-5">
        {/* Beslutning - Required */}
        <div>
          <label htmlFor="beslutning-input" className="block text-base font-medium text-neutral-700 mb-2">
            Hva har dere besluttet? <span className="text-feedback-error">*</span>
          </label>
          <textarea
            ref={beslutningRef}
            id="beslutning-input"
            value={beslutning}
            onChange={handleBeslutningChange}
            onKeyDown={handleKeyDown}
            placeholder="Vi har besluttet å..."
            maxLength={BESLUTNINGSLOGG_VALIDATION.MAX_BESLUTNING_LENGTH}
            aria-describedby={validationError ? 'beslutning-error beslutning-help' : 'beslutning-help'}
            aria-invalid={validationError ? 'true' : undefined}
            className={cn(
              'w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 rounded-lg',
              'resize-none min-h-[120px]',
              'placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
              'aria-[invalid=true]:border-feedback-error',
              validationError ? 'border-feedback-error' : 'border-neutral-300'
            )}
          />
          <div id="beslutning-help" className="mt-2 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Minst {BESLUTNINGSLOGG_VALIDATION.MIN_BESLUTNING_LENGTH} tegn
            </span>
            <span className={cn(
              'text-xs',
              charCount >= BESLUTNINGSLOGG_VALIDATION.MIN_BESLUTNING_LENGTH ? 'text-neutral-500' : 'text-neutral-400'
            )}>
              {charCount} / {BESLUTNINGSLOGG_VALIDATION.MAX_BESLUTNING_LENGTH}
            </span>
          </div>
          {validationError && (
            <p id="beslutning-error" className="mt-2 text-sm text-feedback-error" role="alert">
              {validationError}
            </p>
          )}
        </div>

        {/* Dato */}
        <div>
          <label htmlFor="dato-input" className="block text-base font-medium text-neutral-700 mb-2">
            Dato
          </label>
          <input
            type="date"
            id="dato-input"
            value={dato}
            onChange={(e) => setDato(e.target.value)}
            className={cn(
              'w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 border-neutral-300 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker'
            )}
          />
        </div>

        {/* Deltakere - Optional */}
        <div>
          <label htmlFor="deltakere-input" className="block text-base font-medium text-neutral-700 mb-2">
            Deltakere <span className="text-neutral-500 font-normal">(valgfritt)</span>
          </label>
          <input
            type="text"
            id="deltakere-input"
            value={deltakere}
            onChange={(e) => setDeltakere(e.target.value)}
            placeholder="F.eks. Produktteam, Leder, Designansvarlig"
            className={cn(
              'w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 border-neutral-300 rounded-lg',
              'placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker'
            )}
          />
        </div>

        {/* Kritiske antakelser - Optional */}
        <div>
          <label htmlFor="antakelser-input" className="block text-base font-medium text-neutral-700 mb-2">
            Kritiske antakelser <span className="text-neutral-500 font-normal">(valgfritt)</span>
          </label>
          <textarea
            id="antakelser-input"
            value={kritiskeAntakelser}
            onChange={(e) => setKritiskeAntakelser(e.target.value)}
            placeholder="Skriv én antakelse per linje, f.eks:&#10;Markedet er stort nok&#10;Brukerne vil betale for denne funksjonen"
            className={cn(
              'w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 border-neutral-300 rounded-lg',
              'resize-none min-h-[100px]',
              'placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker'
            )}
          />
          <p className="mt-1 text-xs text-neutral-500">Én antakelse per linje</p>
        </div>

        {/* Akseptert usikkerhet - Optional */}
        <div>
          <label htmlFor="usikkerhet-input" className="block text-base font-medium text-neutral-700 mb-2">
            Akseptert usikkerhet <span className="text-neutral-500 font-normal">(valgfritt)</span>
          </label>
          <textarea
            id="usikkerhet-input"
            value={akseptertUsikkerhet}
            onChange={(e) => setAkseptertUsikkerhet(e.target.value)}
            placeholder="Hva vet dere at dere ikke vet? F.eks:&#10;Vi vet ikke nøyaktig hvor stor markedsandelen er&#10;Vi har ikke testet prismodellen"
            className={cn(
              'w-full px-4 py-3 text-base text-neutral-700 bg-white border-2 border-neutral-300 rounded-lg',
              'resize-none min-h-[100px]',
              'placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker'
            )}
          />
          <p className="mt-1 text-xs text-neutral-500">Én usikkerhet per linje</p>
        </div>
      </section>

      {/* Generate button - desktop only */}
      <div className="hidden md:block">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!isValid}
          className={cn(
            'inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl transition-all',
            'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2',
            isValid
              ? 'bg-brand-navy text-white hover:bg-brand-navy/90 hover:scale-[1.02] active:scale-100 shadow-lg hover:shadow-xl'
              : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
          )}
        >
          Lag Markdown
        </button>
      </div>

      {/* Preview section */}
      {showPreview && markdownOutput && (
        <div ref={previewRef} className="space-y-4">
          <div className="p-6 bg-white border-2 border-neutral-200 rounded-xl shadow-sm">
            {/* Header with copy button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-navy">Forhåndsvisning</h2>
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2',
                  copied
                    ? 'bg-feedback-success text-white'
                    : 'bg-brand-navy text-white hover:bg-brand-navy/90'
                )}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Kopiert!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Kopier Markdown
                  </>
                )}
              </button>
            </div>

            {/* Rendered preview */}
            <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="prose prose-sm max-w-none">
                <h1 className="text-xl font-bold text-brand-navy mb-4">Beslutningslogg</h1>

                <h2 className="text-lg font-semibold text-brand-navy mt-4 mb-2">Beslutning</h2>
                <p className="text-neutral-700 whitespace-pre-wrap">{formData.beslutning}</p>

                {(formData.kritiskeAntakelser?.length || formData.akseptertUsikkerhet?.length) && (
                  <>
                    <h2 className="text-lg font-semibold text-brand-navy mt-4 mb-2">Grunnlag</h2>

                    {formData.kritiskeAntakelser && formData.kritiskeAntakelser.length > 0 && (
                      <>
                        <h3 className="text-base font-medium text-neutral-700 mt-3 mb-1">Kritiske antakelser</h3>
                        <ul className="list-disc list-inside text-neutral-700 space-y-1">
                          {formData.kritiskeAntakelser.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {formData.akseptertUsikkerhet && formData.akseptertUsikkerhet.length > 0 && (
                      <>
                        <h3 className="text-base font-medium text-neutral-700 mt-3 mb-1">Akseptert usikkerhet</h3>
                        <ul className="list-disc list-inside text-neutral-700 space-y-1">
                          {formData.akseptertUsikkerhet.map((u, i) => (
                            <li key={i}>{u}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                )}

                <h2 className="text-lg font-semibold text-brand-navy mt-4 mb-2">Dato</h2>
                <p className="text-neutral-700">{formatDateNorwegian(formData.dato)}</p>

                {formData.deltakere && (
                  <>
                    <h2 className="text-lg font-semibold text-brand-navy mt-4 mb-2">Deltakere</h2>
                    <p className="text-neutral-700">{formData.deltakere}</p>
                  </>
                )}
              </div>
            </div>

            {/* Raw Markdown (collapsible) */}
            <details className="mt-4">
              <summary className="text-sm text-neutral-600 cursor-pointer hover:text-brand-navy transition-colors">
                Vis rå Markdown
              </summary>
              <pre className="mt-2 p-4 bg-neutral-900 text-neutral-100 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                {markdownOutput}
              </pre>
            </details>

            {/* Action buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleEdit}
                className={cn(
                  'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all',
                  'border-2 border-neutral-300 text-neutral-700 bg-white',
                  'hover:border-brand-navy hover:text-brand-navy',
                  'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2'
                )}
              >
                Rediger
              </button>
              <button
                type="button"
                onClick={handleReset}
                className={cn(
                  'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all',
                  'border-2 border-neutral-300 text-neutral-700 bg-white',
                  'hover:border-feedback-error hover:text-feedback-error',
                  'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2'
                )}
              >
                Start på nytt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info about the tool */}
      <section className="p-4 bg-neutral-100 border border-neutral-200 rounded-xl">
        <p className="text-sm text-neutral-600">
          <span className="font-medium">Om dette verktøyet:</span> Beslutningsloggen hjelper deg med å dokumentere viktige beslutninger på en strukturert måte. Den genererer Markdown som du kan lime inn i Notion, Confluence, GitHub eller andre verktøy teamet ditt bruker.
        </p>
      </section>
    </div>
  );
}
