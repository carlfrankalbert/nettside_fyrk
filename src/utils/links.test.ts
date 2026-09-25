import { describe, it, expect } from 'vitest';
import { EXTERNAL_LINKS } from './links';

describe('EXTERNAL_LINKS', () => {
  // Regression: the site linked to /in/carlfajohnson/, which LinkedIn answers
  // with 404. The correct slug is the one the FYRK company page lists for its
  // employee (linkedin.com/company/fyrk → "Carl Johnson" → /in/carlfrankalbert).
  // Check there before changing this; LinkedIn hides profiles from bots, so a
  // wrong slug can't be caught automatically.
  it('links to the personal LinkedIn profile listed on the company page', () => {
    expect(EXTERNAL_LINKS.linkedinPersonal).toBe('https://www.linkedin.com/in/carlfrankalbert/');
  });

  it('links to the FYRK company page', () => {
    expect(EXTERNAL_LINKS.linkedin).toBe('https://www.linkedin.com/company/fyrk/');
  });
});
