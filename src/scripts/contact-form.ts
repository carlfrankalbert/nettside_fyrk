/**
 * Contact form validation
 * Handles client-side form validation with proper accessibility
 */

import {
  validateField,
  validateCheckbox,
  setFieldInvalid,
  clearFieldInvalid,
  focusFirstInvalidField,
  ValidationMessages,
} from '../utils/form-validation';

export function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Clear all previous errors
    const errorElements = form.querySelectorAll('[id$="-error"]');
    errorElements.forEach((el) => {
      el.classList.add('hidden');
      el.textContent = '';
    });

    const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      'input[required], textarea[required]'
    );
    let isValid = true;

    // Validate all required fields
    inputs.forEach((input) => {
      const validation = validateField(input);
      if (!validation.result.isValid) {
        isValid = false;
      }
    });

    // Check consent checkbox separately
    const consent = document.getElementById('consent') as HTMLInputElement | null;
    const consentError = document.getElementById('consent-error');

    if (consent) {
      clearFieldInvalid(consent, consentError);
      const consentValidation = validateCheckbox(consent);

      if (!consentValidation.isValid) {
        isValid = false;
        setFieldInvalid(consent, consentError, ValidationMessages.consent);
      }
    }

    if (isValid) {
      form.submit();
    } else {
      focusFirstInvalidField(form);
    }
  });
}


