import { SessionExpiry } from './session-expiry.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('SessionExpiry', () => {
  const NOW = new Date('2026-05-13T12:00:00Z');

  describe('fromDate', () => {
    it('accepts a future date', () => {
      const expires = new Date('2026-05-13T13:00:00Z');
      const exp = SessionExpiry.fromDate(expires, NOW);
      expect(exp.expiresAt).toEqual(expires);
    });

    it('rejects a past date', () => {
      const past = new Date('2026-05-13T11:00:00Z');
      expect(() => SessionExpiry.fromDate(past, NOW)).toThrow(DomainException);
    });

    it('rejects "now" exactly (not strictly future)', () => {
      expect(() => SessionExpiry.fromDate(NOW, NOW)).toThrow(DomainException);
    });

    it('rejects an Invalid Date', () => {
      expect(() => SessionExpiry.fromDate(new Date('not-a-date'), NOW)).toThrow(DomainException);
    });
  });

  describe('fromTtlSeconds', () => {
    it('produces an expiry that many seconds in the future', () => {
      const exp = SessionExpiry.fromTtlSeconds(3600, NOW);
      expect(exp.expiresAt.getTime() - NOW.getTime()).toBe(3600 * 1000);
    });

    it('rejects zero ttl', () => {
      expect(() => SessionExpiry.fromTtlSeconds(0, NOW)).toThrow(DomainException);
    });

    it('rejects negative ttl', () => {
      expect(() => SessionExpiry.fromTtlSeconds(-100, NOW)).toThrow(DomainException);
    });

    it('rejects NaN ttl', () => {
      expect(() => SessionExpiry.fromTtlSeconds(Number.NaN, NOW)).toThrow(DomainException);
    });
  });

  describe('isExpired', () => {
    it('is false before the expiry', () => {
      const exp = SessionExpiry.fromTtlSeconds(3600, NOW);
      expect(exp.isExpired(NOW)).toBe(false);
    });

    it('is true at the expiry', () => {
      const exp = SessionExpiry.fromTtlSeconds(60, NOW);
      const after = new Date(NOW.getTime() + 60 * 1000);
      expect(exp.isExpired(after)).toBe(true);
    });

    it('is true after the expiry', () => {
      const exp = SessionExpiry.fromTtlSeconds(60, NOW);
      const after = new Date(NOW.getTime() + 120 * 1000);
      expect(exp.isExpired(after)).toBe(true);
    });
  });

  describe('secondsUntilExpiry', () => {
    it('returns the remaining seconds', () => {
      const exp = SessionExpiry.fromTtlSeconds(3600, NOW);
      expect(exp.secondsUntilExpiry(NOW)).toBe(3600);
    });

    it('returns 0 when expired', () => {
      const exp = SessionExpiry.fromTtlSeconds(60, NOW);
      const after = new Date(NOW.getTime() + 120 * 1000);
      expect(exp.secondsUntilExpiry(after)).toBe(0);
    });
  });
});
