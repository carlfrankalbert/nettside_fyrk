import { describe, it, expect } from 'vitest';
import { validateOrigin } from './validate-origin';

// A stub rather than a real Request: under the happy-dom environment the
// Request constructor drops `origin`, which is a forbidden header name, and
// the function would then always see the "no origin" path. validateOrigin
// reads nothing but headers.get.
function requestWith(headers: Record<string, string>): Request {
  return {
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  } as unknown as Request;
}

describe('validateOrigin', () => {
  it('allows a request with no origin header', () => {
    // Same-origin browser requests and non-browser clients omit it.
    expect(validateOrigin(requestWith({ host: 'fyrk.no' }))).toBe(true);
  });

  it('allows an origin matching the host header', () => {
    expect(
      validateOrigin(requestWith({ origin: 'https://example.test', host: 'example.test' }))
    ).toBe(true);
  });

  it('allows the production domain and its subdomains', () => {
    expect(validateOrigin(requestWith({ origin: 'https://fyrk.no', host: 'other' }))).toBe(true);
    expect(validateOrigin(requestWith({ origin: 'https://loop.fyrk.no', host: 'other' }))).toBe(true);
  });

  it('rejects a cross-origin request', () => {
    expect(
      validateOrigin(requestWith({ origin: 'https://evil.example', host: 'fyrk.no' }))
    ).toBe(false);
  });

  it('rejects a domain that merely ends in the production domain', () => {
    // notfyrk.no must not pass as a .fyrk.no subdomain.
    expect(
      validateOrigin(requestWith({ origin: 'https://notfyrk.no', host: 'fyrk.no' }))
    ).toBe(false);
  });

  it('rejects the production domain used as a subdomain of an attacker domain', () => {
    expect(
      validateOrigin(requestWith({ origin: 'https://fyrk.no.evil.example', host: 'fyrk.no' }))
    ).toBe(false);
  });

  it('rejects a malformed origin', () => {
    expect(validateOrigin(requestWith({ origin: 'not-a-url', host: 'fyrk.no' }))).toBe(false);
  });

  it('distinguishes ports, since host includes them', () => {
    expect(
      validateOrigin(requestWith({ origin: 'https://example.test:8080', host: 'example.test:8080' }))
    ).toBe(true);
    expect(
      validateOrigin(requestWith({ origin: 'https://example.test:8080', host: 'example.test' }))
    ).toBe(false);
  });
});
