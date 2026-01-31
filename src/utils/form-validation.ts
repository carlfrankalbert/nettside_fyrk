/**
 * Form validation utilities
 * Provides reusable validation functions with accessibility support
 */

import { INPUT_VALIDATION, PRE_MORTEM_VALIDATION } from './constants';

// ============================================================================
// Text Input Validation (for React components)
// ============================================================================

/**
 * Generic text input validation
 * Returns error message if invalid, null if valid
 */
export function validateTextInput(
  input: string,
  options: {
    minLength?: number;
    maxLength?: number;
    minLengthMessage?: string;
    maxLengthMessage?: string;
  } = {}
): string | null {
  const {
    minLength = INPUT_VALIDATION.MIN_LENGTH,
    maxLength = INPUT_VALIDATION.MAX_LENGTH,
    minLengthMessage = `Teksten må være minst ${minLength} tegn.`,
    maxLengthMessage = `Teksten kan ikke være lengre enn ${maxLength} tegn.`,
  } = options;

  const trimmedInput = input.trim();

  if (trimmedInput.length < minLength) {
    return minLengthMessage;
  }

  if (trimmedInput.length > maxLength) {
    return maxLengthMessage;
  }

  return null;
}

/**
 * Validate konsept input for Konseptspeilet
 */
export function validateKonseptInput(input: string): string | null {
  return validateTextInput(input, {
    minLengthMessage: `Beskriv konseptet med minst ${INPUT_VALIDATION.MIN_LENGTH} tegn for å få en god refleksjon.`,
    maxLengthMessage: `Konseptbeskrivelsen kan ikke være lengre enn ${INPUT_VALIDATION.MAX_LENGTH} tegn.`,
  });
}

/**
 * Validate decision input for Antakelseskart
 */
export function validateBeslutningInput(input: string): string | null {
  return validateTextInput(input, {
    minLengthMessage: `Beskriv beslutningen med minst ${INPUT_VALIDATION.MIN_LENGTH} tegn for å få gode antakelser.`,
    maxLengthMessage: `Beslutningsbeskrivelsen kan ikke være lengre enn ${INPUT_VALIDATION.MAX_LENGTH} tegn.`,
  });
}

/**
 * Validate OKR input for OKR-sjekken
 * Includes additional structure validation for OKR format
 */
export function validateOKRInput(input: string): string | null {
  const trimmedInput = input.trim();

  // Check minimum length
  if (trimmedInput.length < INPUT_VALIDATION.MIN_LENGTH) {
    return `Input må være minst ${INPUT_VALIDATION.MIN_LENGTH} tegn. Skriv inn et komplett OKR-sett.`;
  }

  // Check maximum length
  if (trimmedInput.length > INPUT_VALIDATION.MAX_LENGTH) {
    return `Input kan ikke være lengre enn ${INPUT_VALIDATION.MAX_LENGTH} tegn. Forkort OKR-settet ditt.`;
  }

  // Check for OKR-like content (case-insensitive)
  const lowerInput = trimmedInput.toLowerCase();

  // Check for Objective indicators
  const hasObjective =
    lowerInput.includes('objective') ||
    lowerInput.includes('mål:') ||
    /\bmål\b/.test(lowerInput) ||  // "mål" as standalone word
    /^o\d*:/im.test(trimmedInput);  // O1:, O2:, O: at start of line

  // Check for Key Result indicators - more robust patterns
  // Avoid false positives like "kroner", "kr." (currency), initials
  const hasKeyResult =
    lowerInput.includes('key result') ||
    lowerInput.includes('nøkkelresultat') ||
    /^kr\s*\d/im.test(trimmedInput) ||      // KR1, KR 1 at start of line
    /^kr\s*:/im.test(trimmedInput) ||       // KR: at start of line
    /^\s*[-•]\s*.+%/m.test(trimmedInput) || // Bullet points with percentages
    /^\s*\d+\.\s+.+%/m.test(trimmedInput);  // Numbered list with percentages (1. ...50%)

  if (!hasObjective) {
    return 'Input ser ikke ut som en OKR. Inkluder minst ett "Objective" eller "Mål".';
  }

  if (!hasKeyResult) {
    return 'Input ser ikke ut som en OKR. Inkluder minst ett "Key Result" (KR1, KR2...) eller nøkkelresultat.';
  }

  return null;
}

/**
 * Pre-Mortem Brief form data interface
 */
export interface PreMortemFormData {
  beslutning: string;
  bransje: string;
  kontekst: string;
  risikoniva: string;
  risikoForklaring?: string;
  kundetype: string;
  beslutningsfrist: string;
  effekthorisont: string;
  tidligereForsok?: string;
  interessenter?: string;
  konfidensialitet?: string;
}

/**
 * Validate Pre-Mortem Brief form data
 * Returns error message if invalid, null if valid
 */
export function validatePreMortemInput(formData: PreMortemFormData): string | null {
  const { beslutning, bransje, kontekst, risikoniva, kundetype, beslutningsfrist, effekthorisont } = formData;

  // Validate required beslutning field
  const trimmedBeslutning = beslutning?.trim() || '';
  if (trimmedBeslutning.length < PRE_MORTEM_VALIDATION.MIN_DECISION_LENGTH) {
    return `Beskriv beslutningen med minst ${PRE_MORTEM_VALIDATION.MIN_DECISION_LENGTH} tegn.`;
  }
  if (trimmedBeslutning.length > PRE_MORTEM_VALIDATION.MAX_DECISION_LENGTH) {
    return `Beslutningen kan ikke være lengre enn ${PRE_MORTEM_VALIDATION.MAX_DECISION_LENGTH} tegn.`;
  }

  // Validate required bransje field
  if (!bransje || bransje.trim() === '') {
    return 'Velg en bransje eller domene.';
  }

  // Validate required kontekst field
  const trimmedKontekst = kontekst?.trim() || '';
  if (trimmedKontekst.length < PRE_MORTEM_VALIDATION.MIN_CONTEXT_LENGTH) {
    return `Beskriv konteksten med minst ${PRE_MORTEM_VALIDATION.MIN_CONTEXT_LENGTH} tegn.`;
  }
  if (trimmedKontekst.length > PRE_MORTEM_VALIDATION.MAX_CONTEXT_LENGTH) {
    return `Konteksten kan ikke være lengre enn ${PRE_MORTEM_VALIDATION.MAX_CONTEXT_LENGTH} tegn.`;
  }

  // Validate required risikoniva field
  if (!risikoniva || risikoniva.trim() === '') {
    return 'Velg et regulatorisk/risikonivå.';
  }

  // Validate required kundetype field
  if (!kundetype || kundetype.trim() === '') {
    return 'Velg en kundetype.';
  }

  // Validate required beslutningsfrist field
  if (!beslutningsfrist || beslutningsfrist.trim() === '') {
    return 'Angi beslutningsfrist.';
  }

  // Validate required effekthorisont field
  if (!effekthorisont || effekthorisont.trim() === '') {
    return 'Angi effekthorisont.';
  }

  // Note: Individual field length limits are enforced by FormTextarea maxLength
  // Server-side also validates total input length

  return null;
}

/**
 * Serialize Pre-Mortem form data to JSON string for API
 */
export function serializePreMortemInput(formData: PreMortemFormData): string {
  return JSON.stringify(formData);
}

// ============================================================================
// DOM-based Form Validation (for Astro components)
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface FieldValidation {
  field: HTMLInputElement | HTMLTextAreaElement;
  errorElement: HTMLElement | null;
  result: ValidationResult;
}

/**
 * Validation error messages in Norwegian
 */
export const ValidationMessages = {
  required: 'Dette feltet er påkrevd',
  email: 'Vennligst skriv inn en gyldig e-postadresse',
  consent: 'Du må samtykke for å sende inn skjemaet',
  empty: 'Lim inn innhold først.',
} as const;

/**
 * Validate that a field has a non-empty value
 */
export function validateRequired(value: string): ValidationResult {
  const trimmed = value.trim();
  return {
    isValid: trimmed.length > 0,
    errorMessage: trimmed.length === 0 ? ValidationMessages.required : undefined,
  };
}

/**
 * Validate email format using native browser validation
 */
export function validateEmail(input: HTMLInputElement): ValidationResult {
  if (!input.value.trim()) {
    return {
      isValid: false,
      errorMessage: ValidationMessages.required,
    };
  }

  return {
    isValid: input.validity.valid,
    errorMessage: input.validity.valid ? undefined : ValidationMessages.email,
  };
}

/**
 * Validate a checkbox is checked
 */
export function validateCheckbox(input: HTMLInputElement): ValidationResult {
  return {
    isValid: input.checked,
    errorMessage: input.checked ? undefined : ValidationMessages.consent,
  };
}

/**
 * Apply invalid state styling and aria attributes to a field
 */
export function setFieldInvalid(
  field: HTMLInputElement | HTMLTextAreaElement,
  errorElement: HTMLElement | null,
  errorMessage: string
): void {
  field.setAttribute('aria-invalid', 'true');
  field.classList.add('border-feedback-error');

  if (errorElement) {
    errorElement.textContent = errorMessage;
  }
}

/**
 * Clear invalid state styling and aria attributes from a field
 */
export function clearFieldInvalid(
  field: HTMLInputElement | HTMLTextAreaElement,
  errorElement: HTMLElement | null
): void {
  field.setAttribute('aria-invalid', 'false');
  field.classList.remove('border-feedback-error');

  if (errorElement) {
    errorElement.textContent = '';
  }
}

/**
 * Find and focus the first invalid field in a form
 */
export function focusFirstInvalidField(form: HTMLFormElement): void {
  const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (firstInvalid) {
    firstInvalid.focus();
  }
}

/**
 * Validate a single form field and update its error state
 */
export function validateField(
  field: HTMLInputElement | HTMLTextAreaElement,
  errorElementId?: string
): FieldValidation {
  const errorElement = errorElementId
    ? document.getElementById(errorElementId)
    : document.getElementById(`${field.id}-error`);

  // Clear previous state
  clearFieldInvalid(field, errorElement);

  let result: ValidationResult;

  if (field.type === 'email') {
    result = validateEmail(field as HTMLInputElement);
  } else if (field.type === 'checkbox') {
    result = validateCheckbox(field as HTMLInputElement);
  } else {
    result = validateRequired(field.value);
  }

  if (!result.isValid && result.errorMessage) {
    setFieldInvalid(field, errorElement, result.errorMessage);
  }

  return {
    field,
    errorElement,
    result,
  };
}
