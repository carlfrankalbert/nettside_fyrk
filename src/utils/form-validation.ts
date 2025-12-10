/**
 * Form validation utilities
 * Provides reusable validation functions with accessibility support
 */

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
