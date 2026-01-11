/**
 * Unit tests for request signing utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createSignature,
  signRequest,
  verifySignedRequest,
  MAX_REQUEST_AGE_MS,
} from './request-signing';

describe('request-signing', () => {
  describe('createSignature', () => {
    it('should create consistent signatures for same inputs', () => {
      const timestamp = 1704067200000;
      const payload = '{"buttonId":"test"}';

      const sig1 = createSignature(timestamp, payload);
      const sig2 = createSignature(timestamp, payload);

      expect(sig1).toBe(sig2);
    });

    it('should create different signatures for different timestamps', () => {
      const payload = '{"buttonId":"test"}';

      const sig1 = createSignature(1704067200000, payload);
      const sig2 = createSignature(1704067200001, payload);

      expect(sig1).not.toBe(sig2);
    });

    it('should create different signatures for different payloads', () => {
      const timestamp = 1704067200000;

      const sig1 = createSignature(timestamp, '{"buttonId":"test1"}');
      const sig2 = createSignature(timestamp, '{"buttonId":"test2"}');

      expect(sig1).not.toBe(sig2);
    });

    it('should return a non-empty string', () => {
      const sig = createSignature(Date.now(), '{}');
      expect(sig).toBeTruthy();
      expect(typeof sig).toBe('string');
      expect(sig.length).toBeGreaterThan(0);
    });
  });

  describe('signRequest', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should sign a simple payload', () => {
      const payload = { buttonId: 'test' };
      const signed = signRequest(payload);

      expect(signed.payload).toEqual(payload);
      expect(signed._ts).toBe(Date.now());
      expect(signed._sig).toBeTruthy();
    });

    it('should include all payload fields', () => {
      const payload = { buttonId: 'test', metadata: { charCount: 100 } };
      const signed = signRequest(payload);

      expect(signed.payload.buttonId).toBe('test');
      expect(signed.payload.metadata).toEqual({ charCount: 100 });
    });

    it('should create valid signature that can be verified', () => {
      const payload = { buttonId: 'test' };
      const signed = signRequest(payload);

      const verification = verifySignedRequest(signed);
      expect(verification.isValid).toBe(true);
      if (verification.isValid) {
        expect(verification.payload).toEqual(payload);
      }
    });
  });

  describe('verifySignedRequest', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should verify valid signed request', () => {
      const signed = signRequest({ buttonId: 'test' });
      const result = verifySignedRequest(signed);

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.payload.buttonId).toBe('test');
      }
    });

    it('should reject request missing payload', () => {
      const result = verifySignedRequest({ _ts: Date.now(), _sig: 'abc' });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Missing signature fields');
      }
    });

    it('should reject request missing timestamp', () => {
      const result = verifySignedRequest({ payload: { buttonId: 'test' }, _sig: 'abc' });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Missing signature fields');
      }
    });

    it('should reject request missing signature', () => {
      const result = verifySignedRequest({ payload: { buttonId: 'test' }, _ts: Date.now() });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Missing signature fields');
      }
    });

    it('should reject expired request', () => {
      const signed = signRequest({ buttonId: 'test' });

      // Advance time past expiration
      vi.advanceTimersByTime(MAX_REQUEST_AGE_MS + 1000);

      const result = verifySignedRequest(signed);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Request expired or invalid timestamp');
      }
    });

    it('should reject request with future timestamp', () => {
      const futureTimestamp = Date.now() + 1000;
      const payload = { buttonId: 'test' };
      const payloadStr = JSON.stringify(payload);

      const result = verifySignedRequest({
        payload,
        _ts: futureTimestamp,
        _sig: createSignature(futureTimestamp, payloadStr),
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Request expired or invalid timestamp');
      }
    });

    it('should reject request with invalid signature', () => {
      const result = verifySignedRequest({
        payload: { buttonId: 'test' },
        _ts: Date.now(),
        _sig: 'invalid-signature',
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Invalid signature');
      }
    });

    it('should reject request with tampered payload', () => {
      const signed = signRequest({ buttonId: 'original' });
      // Tamper with payload
      signed.payload = { buttonId: 'tampered' };

      const result = verifySignedRequest(signed);

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Invalid signature');
      }
    });

    it('should accept request just before expiration', () => {
      const signed = signRequest({ buttonId: 'test' });

      // Advance time to just before expiration
      vi.advanceTimersByTime(MAX_REQUEST_AGE_MS - 1000);

      const result = verifySignedRequest(signed);

      expect(result.isValid).toBe(true);
    });
  });
});
