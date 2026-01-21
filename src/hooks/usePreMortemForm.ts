import { useState, useCallback, useEffect } from 'react';
import { trackClick } from '../utils/tracking';
import { PRE_MORTEM_VALIDATION } from '../utils/constants';
import {
  validatePreMortemInput,
  serializePreMortemInput,
  type PreMortemFormData,
} from '../utils/form-validation';

// Form field options
export const BRANSJE_OPTIONS = [
  { value: '', label: 'Velg bransje...' },
  { value: 'bank_finans', label: 'Bank / Finans' },
  { value: 'offentlig', label: 'Offentlig sektor' },
  { value: 'energi', label: 'Energi' },
  { value: 'b2b_saas', label: 'B2B SaaS' },
  { value: 'annet', label: 'Annet' },
] as const;

export const RISIKONIVA_OPTIONS = [
  { value: '', label: 'Velg nivå...' },
  { value: 'lav', label: 'Lav' },
  { value: 'medium', label: 'Medium' },
  { value: 'hoy', label: 'Høy' },
] as const;

export const KUNDETYPE_OPTIONS = [
  { value: '', label: 'Velg kundetype...' },
  { value: 'b2c', label: 'B2C' },
  { value: 'b2b', label: 'B2B' },
  { value: 'offentlig', label: 'Offentlig' },
] as const;

export const KONFIDENSIALITET_OPTIONS = [
  { value: 'intern', label: 'Intern (normal detalj)' },
  { value: 'begrenset', label: 'Begrenset (moderat detalj)' },
  { value: 'styresensitiv', label: 'Styresensitiv (abstrakt)' },
] as const;

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

export interface UsePreMortemFormReturn {
  formData: PreMortemFormData;
  updateField: (field: keyof PreMortemFormData, value: string) => void;
  resetForm: () => void;
  validateForm: () => string | null;
  serializeForm: () => string;
  hasRequiredFields: boolean;
}

/**
 * Hook for Pre-Mortem form state management
 */
export function usePreMortemForm(
  clearError: () => void
): UsePreMortemFormReturn {
  const [formData, setFormData] = useState<PreMortemFormData>(INITIAL_FORM_STATE);

  const updateField = useCallback(
    (field: keyof PreMortemFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      clearError();
    },
    [clearError]
  );

  const resetForm = useCallback(() => {
    trackClick('premortem_reset');
    setFormData(INITIAL_FORM_STATE);
  }, []);

  const validateForm = useCallback(() => {
    return validatePreMortemInput(formData);
  }, [formData]);

  const serializeForm = useCallback(() => {
    return serializePreMortemInput(formData);
  }, [formData]);

  const hasRequiredFields =
    formData.beslutning.trim().length >= PRE_MORTEM_VALIDATION.MIN_DECISION_LENGTH &&
    !!formData.bransje &&
    formData.kontekst.trim().length >= PRE_MORTEM_VALIDATION.MIN_CONTEXT_LENGTH &&
    !!formData.risikoniva &&
    !!formData.kundetype &&
    !!formData.beslutningsfrist &&
    !!formData.effekthorisont;

  return {
    formData,
    updateField,
    resetForm,
    validateForm,
    serializeForm,
    hasRequiredFields,
  };
}

interface UseMobileSyncOptions {
  toolName: string;
  hasRequiredFields: boolean;
  loading: boolean;
  hasResult: boolean;
  isStreaming: boolean;
  onSubmit: () => void;
}

/**
 * Hook for syncing with mobile CTA bar
 */
export function useMobileSync({
  toolName,
  hasRequiredFields,
  loading,
  hasResult,
  isStreaming,
  onSubmit,
}: UseMobileSyncOptions): void {
  // Dispatch state changes to mobile CTA bar
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(`${toolName}:inputChange`, {
        detail: {
          isValid: hasRequiredFields,
          isLoading: loading,
          hasResult: hasResult && !isStreaming,
        },
      })
    );
  }, [toolName, hasRequiredFields, loading, hasResult, isStreaming]);

  // Listen for mobile submit trigger
  useEffect(() => {
    const handleMobileSubmit = () => onSubmit();
    window.addEventListener(`${toolName}:submit`, handleMobileSubmit);
    return () => window.removeEventListener(`${toolName}:submit`, handleMobileSubmit);
  }, [toolName, onSubmit]);
}
