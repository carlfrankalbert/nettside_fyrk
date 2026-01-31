/**
 * Unit tests for form validation utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateRequired,
  validateEmail,
  validateCheckbox,
  setFieldInvalid,
  clearFieldInvalid,
  focusFirstInvalidField,
  validateField,
  ValidationMessages,
  validatePreMortemInput,
  serializePreMortemInput,
  type PreMortemFormData,
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

  describe('validatePreMortemInput', () => {
    const validFormData: PreMortemFormData = {
      beslutning: 'Vi vurderer å bytte fra on-premise til cloud-basert infrastruktur for alle kundedatabaser.',
      bransje: 'bank_finans',
      kontekst: 'Vi har 50 000 aktive kunder og behandler ca. 2 millioner transaksjoner daglig.',
      risikoniva: 'hoy',
      kundetype: 'b2b',
      beslutningsfrist: 'Q2 2024',
      effekthorisont: '12-24 måneder',
    };

    it('should return null for valid form data', () => {
      expect(validatePreMortemInput(validFormData)).toBeNull();
    });

    describe('beslutning validation', () => {
      it('should return error if beslutning is too short', () => {
        const result = validatePreMortemInput({ ...validFormData, beslutning: 'Kort' });
        expect(result).toContain('minst');
        expect(result).toContain('tegn');
      });

      it('should return error if beslutning is empty', () => {
        const result = validatePreMortemInput({ ...validFormData, beslutning: '' });
        expect(result).toContain('minst');
      });

      it('should return error if beslutning exceeds max length', () => {
        const longBeslutning = 'a'.repeat(1001);
        const result = validatePreMortemInput({ ...validFormData, beslutning: longBeslutning });
        expect(result).toContain('lengre enn');
      });

      it('should trim whitespace when validating beslutning', () => {
        const result = validatePreMortemInput({ ...validFormData, beslutning: '   ' });
        expect(result).toContain('minst');
      });
    });

    describe('bransje validation', () => {
      it('should return error if bransje is empty', () => {
        const result = validatePreMortemInput({ ...validFormData, bransje: '' });
        expect(result).toBe('Velg en bransje eller domene.');
      });

      it('should return error if bransje is whitespace only', () => {
        const result = validatePreMortemInput({ ...validFormData, bransje: '   ' });
        expect(result).toBe('Velg en bransje eller domene.');
      });
    });

    describe('kontekst validation', () => {
      it('should return error if kontekst is too short', () => {
        const result = validatePreMortemInput({ ...validFormData, kontekst: 'Kort' });
        expect(result).toContain('konteksten');
        expect(result).toContain('minst');
      });

      it('should return error if kontekst exceeds max length', () => {
        const longKontekst = 'a'.repeat(1501);
        const result = validatePreMortemInput({ ...validFormData, kontekst: longKontekst });
        expect(result).toContain('Konteksten');
        expect(result).toContain('lengre enn');
      });
    });

    describe('risikoniva validation', () => {
      it('should return error if risikoniva is empty', () => {
        const result = validatePreMortemInput({ ...validFormData, risikoniva: '' });
        expect(result).toBe('Velg et regulatorisk/risikonivå.');
      });
    });

    describe('kundetype validation', () => {
      it('should return error if kundetype is empty', () => {
        const result = validatePreMortemInput({ ...validFormData, kundetype: '' });
        expect(result).toBe('Velg en kundetype.');
      });
    });

    describe('beslutningsfrist validation', () => {
      it('should return error if beslutningsfrist is empty', () => {
        const result = validatePreMortemInput({ ...validFormData, beslutningsfrist: '' });
        expect(result).toBe('Angi beslutningsfrist.');
      });
    });

    describe('effekthorisont validation', () => {
      it('should return error if effekthorisont is empty', () => {
        const result = validatePreMortemInput({ ...validFormData, effekthorisont: '' });
        expect(result).toBe('Angi effekthorisont.');
      });
    });

    describe('optional fields', () => {
      it('should accept form data with optional fields', () => {
        const withOptional: PreMortemFormData = {
          ...validFormData,
          risikoForklaring: 'GDPR, PCI-DSS',
          tidligereForsok: 'Vi prøvde dette i 2020',
          interessenter: 'IT, Legal, CFO',
          konfidensialitet: 'begrenset',
        };
        expect(validatePreMortemInput(withOptional)).toBeNull();
      });

      it('should accept form data without optional fields', () => {
        const minimalValid: PreMortemFormData = {
          beslutning: 'En beslutning som er lang nok til å validere riktig.',
          bransje: 'offentlig',
          kontekst: 'Kontekst som er lang nok.',
          risikoniva: 'medium',
          kundetype: 'b2c',
          beslutningsfrist: '2024',
          effekthorisont: '6 mnd',
        };
        expect(validatePreMortemInput(minimalValid)).toBeNull();
      });
    });
  });

  describe('serializePreMortemInput', () => {
    it('should serialize form data to JSON string', () => {
      const formData: PreMortemFormData = {
        beslutning: 'Test beslutning',
        bransje: 'bank_finans',
        kontekst: 'Test kontekst',
        risikoniva: 'lav',
        kundetype: 'b2b',
        beslutningsfrist: 'Q1',
        effekthorisont: '6 mnd',
      };

      const result = serializePreMortemInput(formData);
      const parsed = JSON.parse(result);

      expect(parsed.beslutning).toBe('Test beslutning');
      expect(parsed.bransje).toBe('bank_finans');
    });

    it('should include optional fields when present', () => {
      const formData: PreMortemFormData = {
        beslutning: 'Test',
        bransje: 'test',
        kontekst: 'Test',
        risikoniva: 'lav',
        kundetype: 'b2b',
        beslutningsfrist: 'Q1',
        effekthorisont: '6 mnd',
        konfidensialitet: 'styresensitiv',
      };

      const result = serializePreMortemInput(formData);
      const parsed = JSON.parse(result);

      expect(parsed.konfidensialitet).toBe('styresensitiv');
    });
  });
});
