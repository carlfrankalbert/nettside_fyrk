import { useCallback } from 'react';
import PreMortemResultDisplay from './PreMortemResultDisplay';
import { FormField, FormTextarea, FormSelect, FormInput } from './form';
import { SpinnerIcon, ErrorIcon } from './ui/Icon';
import { PrivacyAccordion } from './ui/PrivacyAccordion';
import { PRE_MORTEM_VALIDATION } from '../utils/constants';
import {
  usePreMortemForm,
  useMobileSync,
  BRANSJE_OPTIONS,
  RISIKONIVA_OPTIONS,
  KUNDETYPE_OPTIONS,
  KONFIDENSIALITET_OPTIONS,
} from '../hooks/usePreMortemForm';
import { usePreMortemStreaming } from '../hooks/usePreMortemStreaming';

/**
 * Main Pre-Mortem Brief component
 */
export default function PreMortemBrief() {
  // Streaming state and actions
  const streaming = usePreMortemStreaming();

  // Form state and actions
  const form = usePreMortemForm(streaming.clearError);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    const validationError = form.validateForm();
    if (validationError) {
      streaming.setError(validationError);
      return;
    }
    streaming.submit(form.serializeForm());
  }, [form, streaming]);

  // Handle combined reset
  const handleReset = useCallback(() => {
    form.resetForm();
    streaming.reset();
  }, [form, streaming]);

  // Mobile CTA bar sync
  useMobileSync({
    toolName: 'premortem',
    hasRequiredFields: form.hasRequiredFields,
    loading: streaming.loading,
    hasResult: !!streaming.result,
    isStreaming: streaming.isStreaming,
    onSubmit: handleSubmit,
  });

  const displayError = streaming.error;

  return (
    <div className="space-y-6" aria-busy={streaming.loading}>
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
        className="space-y-6"
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
            value={form.formData.beslutning}
            onChange={(v) => form.updateField('beslutning', v)}
            placeholder="F.eks: Vi vurderer å bytte fra on-premise til cloud-basert infrastruktur for alle kundedatabaser..."
            maxLength={PRE_MORTEM_VALIDATION.MAX_DECISION_LENGTH}
            rows={4}
            disabled={streaming.loading}
          />
        </FormField>

        {/* Bransje og Kundetype - side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Bransje / Domene" id="bransje" required>
            <FormSelect
              id="bransje"
              value={form.formData.bransje}
              onChange={(v) => form.updateField('bransje', v)}
              options={BRANSJE_OPTIONS}
              disabled={streaming.loading}
            />
          </FormField>

          <FormField label="Kundetype" id="kundetype" required>
            <FormSelect
              id="kundetype"
              value={form.formData.kundetype}
              onChange={(v) => form.updateField('kundetype', v)}
              options={KUNDETYPE_OPTIONS}
              disabled={streaming.loading}
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
            value={form.formData.kontekst}
            onChange={(v) => form.updateField('kontekst', v)}
            placeholder="F.eks: Vi har 50 000 aktive kunder og behandler ca. 2 millioner transaksjoner daglig. Dagens løsning er 8 år gammel..."
            maxLength={PRE_MORTEM_VALIDATION.MAX_CONTEXT_LENGTH}
            rows={3}
            disabled={streaming.loading}
          />
        </FormField>

        {/* Risikonivå */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Regulatorisk / Risikonivå" id="risikoniva" required>
            <FormSelect
              id="risikoniva"
              value={form.formData.risikoniva}
              onChange={(v) => form.updateField('risikoniva', v)}
              options={RISIKONIVA_OPTIONS}
              disabled={streaming.loading}
            />
          </FormField>

          <FormField
            label="Forklaring (valgfritt)"
            id="risikoForklaring"
            helpText="Utdyp risikonivået"
          >
            <FormInput
              id="risikoForklaring"
              value={form.formData.risikoForklaring || ''}
              onChange={(v) => form.updateField('risikoForklaring', v)}
              placeholder="F.eks: GDPR, PCI-DSS krav..."
              disabled={streaming.loading}
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
              value={form.formData.beslutningsfrist}
              onChange={(v) => form.updateField('beslutningsfrist', v)}
              placeholder="F.eks: Innen Q2 2024, 15. mars..."
              disabled={streaming.loading}
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
              value={form.formData.effekthorisont}
              onChange={(v) => form.updateField('effekthorisont', v)}
              placeholder="F.eks: 6-24 måneder, 2-3 år..."
              disabled={streaming.loading}
            />
          </FormField>
        </div>

        {/* Optional fields */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-brand-navy hover:text-brand-cyan-darker">
            Valgfrie felt (klikk for å utvide)
          </summary>
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-neutral-200">
            <FormField label="Tidligere forsøk eller relevant erfaring" id="tidligereForsok">
              <FormTextarea
                id="tidligereForsok"
                value={form.formData.tidligereForsok || ''}
                onChange={(v) => form.updateField('tidligereForsok', v)}
                placeholder="Har lignende beslutninger vært tatt før? Hva skjedde?"
                rows={2}
                disabled={streaming.loading}
              />
            </FormField>

            <FormField label="Nøkkelinteressenter" id="interessenter">
              <FormTextarea
                id="interessenter"
                value={form.formData.interessenter || ''}
                onChange={(v) => form.updateField('interessenter', v)}
                placeholder="Hvem påvirkes av beslutningen? Hvem har innflytelse?"
                rows={2}
                disabled={streaming.loading}
              />
            </FormField>

            <FormField
              label="Konfidensialitetsnivå"
              id="konfidensialitet"
              helpText="Påvirker detaljnivå i output"
            >
              <FormSelect
                id="konfidensialitet"
                value={form.formData.konfidensialitet || 'intern'}
                onChange={(v) => form.updateField('konfidensialitet', v)}
                options={KONFIDENSIALITET_OPTIONS}
                disabled={streaming.loading}
              />
            </FormField>
          </div>
        </details>

        {/* Error display */}
        {displayError && (
          <div className="p-3 bg-feedback-error/10 border border-feedback-error/20 rounded-lg">
            <p className="text-sm text-feedback-error flex items-center gap-2">
              <ErrorIcon className="w-4 h-4 flex-shrink-0" />
              {displayError}
            </p>
          </div>
        )}

        {/* Submit button - desktop */}
        <div className="hidden md:flex md:items-center gap-4">
          <button
            type="submit"
            disabled={streaming.loading}
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-brand-navy rounded-lg hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {streaming.loading ? (
              <>
                <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Genererer brief...
              </>
            ) : (
              'Generer Pre-Mortem Brief'
            )}
          </button>

          {streaming.result && !streaming.loading && (
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
        ref={streaming.resultRef}
        aria-live="polite"
        aria-atomic="false"
        role="region"
        aria-label="Pre-Mortem Brief resultat"
      >
        {(streaming.result || streaming.isStreaming) && (
          <div className="mt-8 p-6 bg-white border-2 border-neutral-200 rounded-lg shadow-sm">
            <PreMortemResultDisplay result={streaming.result || ''} isStreaming={streaming.isStreaming} />

            {/* Reset button after result */}
            {streaming.result && !streaming.loading && (
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
