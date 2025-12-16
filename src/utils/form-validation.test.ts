/**
 * Unit tests for form validation utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateRequired,
  validateEmail,
  validateCheckbox,
  setFieldInvalid,
  clearFieldInvalid,
  focusFirstInvalidField,
  validateField,
  ValidationMessages,
} from './form-validation';

describe('form-validation', () => {
  describe('validateRequired', () => {
    it('should return valid for non-empty string', () => {
      const result = validateRequired('hello');
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should return invalid for empty string', () => {
      const result = validateRequired('');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(ValidationMessages.required);
    });

    it('should return invalid for whitespace-only string', () => {
      const result = validateRequired('   ');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(ValidationMessages.required);
    });

    it('should trim whitespace and validate content', () => {
      const result = validateRequired('  valid  ');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateEmail', () => {
    let mockInput: HTMLInputElement;

    beforeEach(() => {
      mockInput = document.createElement('input');
      mockInput.type = 'email';
    });

    it('should return invalid for empty email', () => {
      mockInput.value = '';
      const result = validateEmail(mockInput);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(ValidationMessages.required);
    });

    it('should return invalid for whitespace-only email', () => {
      mockInput.value = '   ';
      const result = validateEmail(mockInput);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(ValidationMessages.required);
    });

    it('should return valid for valid email', () => {
      mockInput.value = 'test@example.com';
      const result = validateEmail(mockInput);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should return invalid for invalid email format', () => {
      mockInput.value = 'invalid-email';
      const result = validateEmail(mockInput);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(ValidationMessages.email);
    });
  });

  describe('validateCheckbox', () => {
    let mockCheckbox: HTMLInputElement;

    beforeEach(() => {
      mockCheckbox = document.createElement('input');
      mockCheckbox.type = 'checkbox';
    });

    it('should return valid when checkbox is checked', () => {
      mockCheckbox.checked = true;
      const result = validateCheckbox(mockCheckbox);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should return invalid when checkbox is unchecked', () => {
      mockCheckbox.checked = false;
      const result = validateCheckbox(mockCheckbox);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(ValidationMessages.consent);
    });
  });

  describe('setFieldInvalid', () => {
    let mockField: HTMLInputElement;
    let mockErrorElement: HTMLElement;

    beforeEach(() => {
      mockField = document.createElement('input');
      mockErrorElement = document.createElement('span');
      mockErrorElement.classList.add('hidden');
    });

    it('should set aria-invalid to true', () => {
      setFieldInvalid(mockField, mockErrorElement, 'Error message');
      expect(mockField.getAttribute('aria-invalid')).toBe('true');
    });

    it('should add error styling class', () => {
      setFieldInvalid(mockField, mockErrorElement, 'Error message');
      expect(mockField.classList.contains('border-feedback-error')).toBe(true);
    });

    it('should set error message text', () => {
      setFieldInvalid(mockField, mockErrorElement, 'Error message');
      expect(mockErrorElement.textContent).toBe('Error message');
    });

    it('should remove hidden class from error element', () => {
      setFieldInvalid(mockField, mockErrorElement, 'Error message');
      expect(mockErrorElement.classList.contains('hidden')).toBe(false);
    });

    it('should handle null error element gracefully', () => {
      expect(() => {
        setFieldInvalid(mockField, null, 'Error message');
      }).not.toThrow();
      expect(mockField.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('clearFieldInvalid', () => {
    let mockField: HTMLInputElement;
    let mockErrorElement: HTMLElement;

    beforeEach(() => {
      mockField = document.createElement('input');
      mockField.setAttribute('aria-invalid', 'true');
      mockField.classList.add('border-feedback-error');

      mockErrorElement = document.createElement('span');
      mockErrorElement.textContent = 'Error message';
    });

    it('should set aria-invalid to false', () => {
      clearFieldInvalid(mockField, mockErrorElement);
      expect(mockField.getAttribute('aria-invalid')).toBe('false');
    });

    it('should remove error styling class', () => {
      clearFieldInvalid(mockField, mockErrorElement);
      expect(mockField.classList.contains('border-feedback-error')).toBe(false);
    });

    it('should clear error message text', () => {
      clearFieldInvalid(mockField, mockErrorElement);
      expect(mockErrorElement.textContent).toBe('');
    });

    it('should add hidden class to error element', () => {
      clearFieldInvalid(mockField, mockErrorElement);
      expect(mockErrorElement.classList.contains('hidden')).toBe(true);
    });

    it('should handle null error element gracefully', () => {
      expect(() => {
        clearFieldInvalid(mockField, null);
      }).not.toThrow();
      expect(mockField.getAttribute('aria-invalid')).toBe('false');
    });
  });

  describe('focusFirstInvalidField', () => {
    let mockForm: HTMLFormElement;
    let invalidField: HTMLInputElement;
    let validField: HTMLInputElement;

    beforeEach(() => {
      mockForm = document.createElement('form');

      validField = document.createElement('input');
      validField.setAttribute('aria-invalid', 'false');

      invalidField = document.createElement('input');
      invalidField.setAttribute('aria-invalid', 'true');
      invalidField.focus = vi.fn();

      mockForm.appendChild(validField);
      mockForm.appendChild(invalidField);
    });

    it('should focus the first invalid field', () => {
      focusFirstInvalidField(mockForm);
      expect(invalidField.focus).toHaveBeenCalled();
    });

    it('should not throw when no invalid fields exist', () => {
      invalidField.setAttribute('aria-invalid', 'false');
      expect(() => {
        focusFirstInvalidField(mockForm);
      }).not.toThrow();
    });
  });

  describe('validateField', () => {
    let mockField: HTMLInputElement;
    let mockErrorElement: HTMLElement;

    beforeEach(() => {
      mockField = document.createElement('input');
      mockField.id = 'test-field';

      mockErrorElement = document.createElement('span');
      mockErrorElement.id = 'test-field-error';

      document.body.appendChild(mockField);
      document.body.appendChild(mockErrorElement);
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should validate required text field', () => {
      mockField.type = 'text';
      mockField.value = '';

      const result = validateField(mockField);

      expect(result.result.isValid).toBe(false);
      expect(result.result.errorMessage).toBe(ValidationMessages.required);
    });

    it('should validate email field', () => {
      mockField.type = 'email';
      mockField.value = 'invalid';

      const result = validateField(mockField);

      expect(result.result.isValid).toBe(false);
      expect(result.result.errorMessage).toBe(ValidationMessages.email);
    });

    it('should validate checkbox field', () => {
      mockField.type = 'checkbox';
      mockField.checked = false;

      const result = validateField(mockField);

      expect(result.result.isValid).toBe(false);
      expect(result.result.errorMessage).toBe(ValidationMessages.consent);
    });

    it('should return valid result for valid input', () => {
      mockField.type = 'text';
      mockField.value = 'valid input';

      const result = validateField(mockField);

      expect(result.result.isValid).toBe(true);
      expect(result.result.errorMessage).toBeUndefined();
    });

    it('should use custom error element ID', () => {
      const customError = document.createElement('span');
      customError.id = 'custom-error';
      document.body.appendChild(customError);

      mockField.type = 'text';
      mockField.value = '';

      const result = validateField(mockField, 'custom-error');

      expect(result.errorElement).toBe(customError);
    });
  });

  describe('ValidationMessages', () => {
    it('should have required message in Norwegian', () => {
      expect(ValidationMessages.required).toBe('Dette feltet er påkrevd');
    });

    it('should have email message in Norwegian', () => {
      expect(ValidationMessages.email).toBe('Vennligst skriv inn en gyldig e-postadresse');
    });

    it('should have consent message in Norwegian', () => {
      expect(ValidationMessages.consent).toBe('Du må samtykke for å sende inn skjemaet');
    });

    it('should have empty message in Norwegian', () => {
      expect(ValidationMessages.empty).toBe('Lim inn innhold først.');
    });
  });
});
