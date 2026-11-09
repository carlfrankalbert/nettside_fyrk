import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Parse public/_redirects into [from, to, status] rules, skipping comments */
function readRedirects(): Array<[string, string, string]> {
  const raw = readFileSync(resolve(__dirname, '../../public/_redirects'), 'utf-8');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/\s+/) as [string, string, string]);
}

describe('public/_redirects', () => {
  const rules = readRedirects();

  // Regression: /about and /tjenester pointed at /konsulenter and /#bidrag,
  // which were removed when FYRK stopped being a consultancy.
  it('never targets removed consultancy routes', () => {
    for (const [, to] of rules) {
      expect(to).not.toMatch(/konsulenter|#bidrag|#kontakt/);
    }
  });

  it('sends the retired /konsulenter page to the front page permanently', () => {
    expect(rules).toContainEqual(['/konsulenter', '/', '301']);
    expect(rules).toContainEqual(['/konsulenter/', '/', '301']);
  });
});
