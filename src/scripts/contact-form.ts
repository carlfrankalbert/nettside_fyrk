/**
 * Contact form validation
 * Handles client-side form validation with proper accessibility
 */

export function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Clear previous errors
    const errorElements = form.querySelectorAll('[id$="-error"]');
    errorElements.forEach(el => {
      el.classList.add('hidden');
      el.textContent = '';
    });
    
    const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      const errorId = input.id + '-error';
      const errorElement = document.getElementById(errorId);
      
      // Remove invalid state
      input.setAttribute('aria-invalid', 'false');
      input.classList.remove('border-feedback-error');
      
      if (!input.value.trim()) {
        isValid = false;
        if (errorElement) {
          errorElement.textContent = 'Dette feltet er påkrevd';
          errorElement.classList.remove('hidden');
        }
        input.setAttribute('aria-invalid', 'true');
        input.classList.add('border-feedback-error');
      } else if (input.type === 'email' && !(input as HTMLInputElement).validity.valid) {
        isValid = false;
        if (errorElement) {
          errorElement.textContent = 'Vennligst skriv inn en gyldig e-postadresse';
          errorElement.classList.remove('hidden');
        }
        input.setAttribute('aria-invalid', 'true');
        input.classList.add('border-feedback-error');
      }
    });
    
    // Check consent checkbox
    const consent = document.getElementById('consent') as HTMLInputElement | null;
    const consentError = document.getElementById('consent-error');
    if (consent && !consent.checked) {
      isValid = false;
      if (consentError) {
        consentError.textContent = 'Du må samtykke for å sende inn skjemaet';
        consentError.classList.remove('hidden');
      }
      consent.setAttribute('aria-invalid', 'true');
    }
    
    if (isValid) {
      // Form is valid, submit it
      form.submit();
    } else {
      // Focus first invalid field
      const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus();
      }
    }
  });
}

