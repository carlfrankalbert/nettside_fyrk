import { describe, it, expect } from 'vitest';
import { EXTERNAL_LINKS } from './links';

describe('EXTERNAL_LINKS', () => {
  it('links to the FYRK company page', () => {
    expect(EXTERNAL_LINKS.linkedin).toBe('https://www.linkedin.com/company/fyrk/');
  });
});
