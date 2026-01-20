import { useState, useRef, useEffect, useCallback } from 'react';
import { generatePreMortemStreaming, ERROR_MESSAGES } from '../services/pre-mortem-service';
import PreMortemResultDisplay from './PreMortemResultDisplay';
import { SpinnerIcon, ErrorIcon } from './ui/Icon';
import { PrivacyAccordion } from './ui/PrivacyAccordion';
import { cn } from '../utils/classes';
import { PRE_MORTEM_VALIDATION, STREAMING_CONSTANTS } from '../utils/constants';
import { trackClick, logEvent } from '../utils/tracking';
import {
  validatePreMortemInput,
  serializePreMortemInput,
  type PreMortemFormData,
} from '../utils/form-validation';

const { HARD_TIMEOUT_MS } = STREAMING_CONSTANTS;

// Form field options
const BRANSJE_OPTIONS = [
  { value: '', label: 'Velg bransje...' },
  { value: 'bank_finans', label: 'Bank / Finans' },
  { value: 'offentlig', label: 'Offentlig sektor' },
  { value: 'energi', label: 'Energi' },
  { value: 'b2b_saas', label: 'B2B SaaS' },
  { value: 'annet', label: 'Annet' },
] as const;

const RISIKONIVA_OPTIONS = [
  { value: '', label: 'Velg nivå...' },
  { value: 'lav', label: 'Lav' },
  { value: 'medium', label: 'Medium' },
  { value: 'hoy', label: 'Høy' },
] as const;

const KUNDETYPE_OPTIONS = [
  { value: '', label: 'Velg kundetype...' },
  { value: 'b2c', label: 'B2C' },
  { value: 'b2b', label: 'B2B' },
  { value: 'offentlig', label: 'Offentlig' },
] as const;

const KONFIDENSIALITET_OPTIONS = [
  { value: 'intern', label: 'Intern (normal detalj)' },
  { value: 'begrenset', label: 'Begrenset (moderat detalj)' },
  { value: 'styresensitiv', label: 'Styresensitiv (abstrakt)' },
] as const;

// Initial form state
const INITIAL_FORM_STATE: PreMortemFormData = {
  beslutning: '',
  bransje: '',
  kontekst: '',
  risikoniva: '',
  risikoForklaring: '',
  kundetype: '',
  beslutningsfrist: '',
  effekthorisont: '',
  tidligereForsok: '',
  interessenter: '',
  konfidensialitet: 'intern',
};

/**
 * Form field component for text inputs
 */
function FormField({
  label,
  id,
  required = false,
  helpText,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
        {required && <span className="text-feedback-error ml-1">*</span>}
      </label>
      {children}
      {helpText && (
        <p className="mt-1 text-xs text-neutral-500">{helpText}</p>
      )}
    </div>
  );
}

/**
 * Textarea component with consistent styling
 */
function FormTextarea({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
  disabled = false,
  error = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  disabled?: boolean;
  error?: boolean;
}) {
  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-sm text-neutral-700 bg-white border-2 rounded-lg',
          'resize-none placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          error ? 'border-feedback-error' : 'border-neutral-300'
        )}
      />
      {maxLength && (
        <div className="mt-1 text-xs text-neutral-500 text-right">
          <span className={cn(value.length > maxLength * 0.9 && 'text-feedback-warning')}>
            {value.length}
          </span>
          {' / '}{maxLength} tegn
        </div>
      )}
    </div>
  );
}

/**
 * Select component with consistent styling
 */
function FormSelect({
  id,
  value,
  onChange,
  options,
  disabled = false,
  error = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  disabled?: boolean;
  error?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-2 text-sm text-neutral-700 bg-white border-2 rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        error ? 'border-feedback-error' : 'border-neutral-300'
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Text input component with consistent styling
 */
function FormInput({
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'date';
  disabled?: boolean;
  error?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-2 text-sm text-neutral-700 bg-white border-2 rounded-lg',
        'placeholder:text-neutral-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        error ? 'border-feedback-error' : 'border-neutral-300'
      )}
    />
  );
}

/**
 * Main Pre-Mortem Brief component
 */
export default function PreMortemBrief() {
  const [formData, setFormData] = useState<PreMortemFormData>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Update form field
  const updateField = useCallback((field: keyof PreMortemFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }, [error]);

  // Reset form
  const handleReset = useCallback(() => {
    trackClick('premortem_reset');
    setFormData(INITIAL_FORM_STATE);
    setResult(null);
    setError(null);
  }, []);

  // Submit form
  const handleSubmit = useCallback(async () => {
    if (loading) return;

    // Validate form
    const validationError = validatePreMortemInput(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    trackClick('premortem_submit');
    startTimeRef.current = Date.now();

    setLoading(true);
    setIsStreaming(true);
    setError(null);
    setResult('');

    // Cancel any existing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Set up timeout
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
      setError(ERROR_MESSAGES.TIMEOUT);
      setLoading(false);
      setIsStreaming(false);
    }, HARD_TIMEOUT_MS);

    try {
      const serializedInput = serializePreMortemInput(formData);

      await generatePreMortemStreaming(
        serializedInput,
        (chunk) => {
          setResult((prev) => (prev || '') + chunk);
        },
        () => {
          clearTimeout(timeoutId);
          setLoading(false);
          setIsStreaming(false);
          abortControllerRef.current = null;

          const processingTimeMs = Date.now() - startTimeRef.current;
          logEvent('premortem_success', { processingTimeMs });

          // Scroll to result
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        },
        (errorMsg) => {
          clearTimeout(timeoutId);
          setError(errorMsg);
          setLoading(false);
          setIsStreaming(false);
          setResult(null);
          abortControllerRef.current = null;
        },
        abortControllerRef.current.signal
      );
    } catch {
      clearTimeout(timeoutId);
      setError(ERROR_MESSAGES.DEFAULT);
      setLoading(false);
      setIsStreaming(false);
    }
  }, [formData, loading]);

  // Dispatch events for mobile CTA bar sync
  useEffect(() => {
    const hasRequiredFields =
      formData.beslutning.trim().length >= PRE_MORTEM_VALIDATION.MIN_DECISION_LENGTH &&
      formData.bransje &&
      formData.kontekst.trim().length >= PRE_MORTEM_VALIDATION.MIN_CONTEXT_LENGTH &&
      formData.risikoniva &&
      formData.kundetype &&
      formData.beslutningsfrist &&
      formData.effekthorisont;

    window.dispatchEvent(
      new CustomEvent('premortem:inputChange', {
        detail: {
          isValid: hasRequiredFields,
          isLoading: loading,
          hasResult: !!result && !isStreaming,
        },
      })
    );
  }, [formData, loading, result, isStreaming]);

  // Listen for mobile submit
  useEffect(() => {
    const handleMobileSubmit = () => handleSubmit();
    window.addEventListener('premortem:submit', handleMobileSubmit);
    return () => window.removeEventListener('premortem:submit', handleMobileSubmit);
  }, [handleSubmit]);

  return (
    <div className="space-y-6" aria-busy={loading}>
      {/* PII Warning */}
      <div className="p-3 bg-feedback-warning/10 border border-feedback-warning/20 rounded-lg">
        <p className="text-sm text-neutral-700">
          <strong>Viktig:</strong> Unngå personopplysninger og hemmelige detaljer i skjemaet.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-5"
      >
        {/* Beslutning */}
        <FormField
          label="Beslutning"
          id="beslutning"
          required
          helpText="Beskriv beslutningen som skal tas"
        >
          <FormTextarea
            id="beslutning"
            value={formData.beslutning}
            onChange={(v) => updateField('beslutning', v)}
            placeholder="F.eks: Vi vurderer å bytte fra on-premise til cloud-basert infrastruktur for alle kundedatabaser..."
            maxLength={PRE_MORTEM_VALIDATION.MAX_DECISION_LENGTH}
            rows={4}
            disabled={loading}
          />
        </FormField>

        {/* Bransje og Kundetype - side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Bransje / Domene" id="bransje" required>
            <FormSelect
              id="bransje"
              value={formData.bransje}
              onChange={(v) => updateField('bransje', v)}
              options={BRANSJE_OPTIONS}
              disabled={loading}
            />
          </FormField>

          <FormField label="Kundetype" id="kundetype" required>
            <FormSelect
              id="kundetype"
              value={formData.kundetype}
              onChange={(v) => updateField('kundetype', v)}
              options={KUNDETYPE_OPTIONS}
              disabled={loading}
            />
          </FormField>
        </div>

        {/* Kontekst */}
        <FormField
          label="Kort kontekst"
          id="kontekst"
          required
          helpText="Bakgrunn og relevante omstendigheter"
        >
          <FormTextarea
            id="kontekst"
            value={formData.kontekst}
            onChange={(v) => updateField('kontekst', v)}
            placeholder="F.eks: Vi har 50 000 aktive kunder og behandler ca. 2 millioner transaksjoner daglig. Dagens løsning er 8 år gammel..."
            maxLength={PRE_MORTEM_VALIDATION.MAX_CONTEXT_LENGTH}
            rows={3}
            disabled={loading}
          />
        </FormField>

        {/* Risikonivå */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Regulatorisk / Risikonivå"
            id="risikoniva"
            required
          >
            <FormSelect
              id="risikoniva"
              value={formData.risikoniva}
              onChange={(v) => updateField('risikoniva', v)}
              options={RISIKONIVA_OPTIONS}
              disabled={loading}
            />
          </FormField>

          <FormField
            label="Forklaring (valgfritt)"
            id="risikoForklaring"
            helpText="Utdyp risikonivået"
          >
            <FormInput
              id="risikoForklaring"
              value={formData.risikoForklaring || ''}
              onChange={(v) => updateField('risikoForklaring', v)}
              placeholder="F.eks: GDPR, PCI-DSS krav..."
              disabled={loading}
            />
          </FormField>
        </div>

        {/* Tidsaspekter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Beslutningsfrist"
            id="beslutningsfrist"
            required
            helpText="Når må beslutningen tas?"
          >
            <FormInput
              id="beslutningsfrist"
              value={formData.beslutningsfrist}
              onChange={(v) => updateField('beslutningsfrist', v)}
              placeholder="F.eks: Innen Q2 2024, 15. mars..."
              disabled={loading}
            />
          </FormField>

          <FormField
            label="Effekthorisont"
            id="effekthorisont"
            required
            helpText="Når forventes effekten?"
          >
            <FormInput
              id="effekthorisont"
              value={formData.effekthorisont}
              onChange={(v) => updateField('effekthorisont', v)}
              placeholder="F.eks: 6-24 måneder, 2-3 år..."
              disabled={loading}
            />
          </FormField>
        </div>

        {/* Optional fields */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-brand-navy hover:text-brand-cyan-darker">
            Valgfrie felt (klikk for å utvide)
          </summary>
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-neutral-200">
            <FormField
              label="Tidligere forsøk eller relevant erfaring"
              id="tidligereForsok"
            >
              <FormTextarea
                id="tidligereForsok"
                value={formData.tidligereForsok || ''}
                onChange={(v) => updateField('tidligereForsok', v)}
                placeholder="Har lignende beslutninger vært tatt før? Hva skjedde?"
                rows={2}
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Nøkkelinteressenter"
              id="interessenter"
            >
              <FormTextarea
                id="interessenter"
                value={formData.interessenter || ''}
                onChange={(v) => updateField('interessenter', v)}
                placeholder="Hvem påvirkes av beslutningen? Hvem har innflytelse?"
                rows={2}
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Konfidensialitetsnivå"
              id="konfidensialitet"
              helpText="Påvirker detaljnivå i output"
            >
              <FormSelect
                id="konfidensialitet"
                value={formData.konfidensialitet || 'intern'}
                onChange={(v) => updateField('konfidensialitet', v)}
                options={KONFIDENSIALITET_OPTIONS}
                disabled={loading}
              />
            </FormField>
          </div>
        </details>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-feedback-error/10 border border-feedback-error/20 rounded-lg">
            <p className="text-sm text-feedback-error flex items-center gap-2">
              <ErrorIcon className="w-4 h-4 flex-shrink-0" />
              {error}
            </p>
          </div>
        )}

        {/* Submit button - desktop */}
        <div className="hidden md:flex md:items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-brand-navy rounded-lg hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Genererer brief...
              </>
            ) : (
              'Generer Pre-Mortem Brief'
            )}
          </button>

          {result && !loading && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
            >
              Start på nytt
            </button>
          )}
        </div>
      </form>

      {/* Result display */}
      <div
        ref={resultRef}
        aria-live="polite"
        aria-atomic="false"
        role="region"
        aria-label="Pre-Mortem Brief resultat"
      >
        {(result || isStreaming) && (
          <div className="mt-8 p-6 bg-white border-2 border-neutral-200 rounded-lg shadow-sm">
            <PreMortemResultDisplay result={result || ''} isStreaming={isStreaming} />

            {/* Reset button after result */}
            {result && !loading && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 transition-colors"
                >
                  Start på nytt
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Privacy accordion */}
      <PrivacyAccordion
        toolName="premortem"
        introText="Informasjonen du legger inn brukes kun til å generere Pre-Mortem Brief. Unngå å legge inn konfidensiell eller sensitiv informasjon."
        howItWorks="Briefen genereres av Claude (Anthropic), en AI-modell som analyserer beslutningsinformasjonen basert på etablerte risikoanalyseprinsipper."
      />
    </div>
  );
}
