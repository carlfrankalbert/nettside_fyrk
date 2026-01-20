/**
 * Form validation utilities
 * Provides reusable validation functions with accessibility support
 */

import { INPUT_VALIDATION } from './constants';

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
  const hasObjective = lowerInput.includes('objective') || lowerInput.includes('mål');
  const hasKeyResult =
    lowerInput.includes('key result') ||
    lowerInput.includes('kr') ||
    lowerInput.includes('nøkkelresultat') ||
    /\d+\./.test(trimmedInput);

  if (!hasObjective) {
    return 'Input ser ikke ut som en OKR. Inkluder minst ett "Objective" eller "Mål".';
  }

  if (!hasKeyResult) {
    return 'Input ser ikke ut som en OKR. Inkluder minst ett "Key Result" eller nøkkelresultat.';
  }

  return null;
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
    errorElement.classList.remove('hidden');
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
    errorElement.classList.add('hidden');
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
