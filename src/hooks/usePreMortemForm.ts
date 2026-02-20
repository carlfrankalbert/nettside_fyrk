import { useState, useCallback, useEffect, useRef } from 'react';
import { trackClick } from '../utils/tracking';
import { PRE_MORTEM_VALIDATION } from '../utils/constants';
import {
  validatePreMortemInput,
  serializePreMortemInput,
  type PreMortemFormData,
} from '../utils/form-validation';

// Form field options — canonical source is preMortemTool.selectOptions in src/data/tools.ts
// Re-exported here for backward compatibility
import { preMortemTool } from '../data/tools';

export const BRANSJE_OPTIONS = preMortemTool.selectOptions.bransje;
export const RISIKONIVA_OPTIONS = preMortemTool.selectOptions.risikoniva;
export const KUNDETYPE_OPTIONS = preMortemTool.selectOptions.kundetype;
export const KONFIDENSIALITET_OPTIONS = preMortemTool.selectOptions.konfidensialitet;

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
  const hasTrackedInputStartRef = useRef(false);

  const updateField = useCallback(
    (field: keyof PreMortemFormData, value: string) => {
      // Track first input (funnel start) - only fire once per session
      if (!hasTrackedInputStartRef.current && value.length > 0) {
        hasTrackedInputStartRef.current = true;
        trackClick('premortem_input_started');
      }
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
