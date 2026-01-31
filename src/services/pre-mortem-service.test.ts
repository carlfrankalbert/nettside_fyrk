/**
 * Unit tests for Pre-Mortem service
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { generatePreMortemStreaming, isValidOutput } from './pre-mortem-service';

// Mock crypto.subtle for hashing
const mockDigest = vi.fn().mockResolvedValue(new ArrayBuffer(32));
vi.stubGlobal('crypto', {
  subtle: {
    digest: mockDigest,
  },
});

describe('pre-mortem-service', () => {
  let fetchMock: Mock;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
    });

    mockDigest.mockResolvedValue(new ArrayBuffer(32));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidOutput', () => {
    it('should return true for complete markdown response', () => {
      const validResponse = `# Pre-Mortem Brief

## Beslutning
Vi lanserer nytt produkt i Q3. Dette er en stor beslutning som påvirker hele organisasjonen.

## Feilmoduser og indikatorer
Hvis dette feiler vil vi se følgende tegn tidlig.

## Stopp-kriterier
Når bør vi stoppe og revurdere beslutningen.

## Eierskap
Hvem har ansvaret for å følge opp.

## God beslutning
Hva kjennetegner en god beslutning her og hvordan sikrer vi kvalitet i prosessen fremover.`;
      expect(isValidOutput(validResponse)).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidOutput('')).toBe(false);
    });

    it('should return false for incomplete response', () => {
      expect(isValidOutput('# Pre-Mortem')).toBe(false);
    });
  });

  describe('generatePreMortemStreaming', () => {
    it('should handle rate limit error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limited' }),
      });

      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await generatePreMortemStreaming('Test input', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('For mange forespørsler. Vent litt før du prøver igjen.');
    });

    it('should handle API errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await generatePreMortemStreaming('Test input', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('Server error');
    });

    it('should handle missing response body', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        body: null,
      });

      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await generatePreMortemStreaming('Test input', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('Noe gikk galt. Prøv igjen.');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await generatePreMortemStreaming('Test input', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('Network error');
    });
  });
});
