import { StateTokenService } from './state-token.service';
import { AppConfigService } from '../../../config/app-config.service';
import { DomainException } from '../../../shared/exceptions/app-error';

const buildService = (
  sessionSecret = 'a-valid-session-secret-of-32-chars-long',
): StateTokenService => new StateTokenService({ sessionSecret } as AppConfigService);

describe('StateTokenService', () => {
  describe('sign + verify roundtrip', () => {
    it('signs a state and verifies it back', () => {
      const service = buildService();
      const state = service.sign({ returnUrl: '/dashboard' });

      const payload = service.verify(state);
      expect(payload.returnUrl).toBe('/dashboard');
      expect(payload.csrf).toMatch(/^[a-f0-9]{32}$/);
    });

    it('round-trips returnUrl with query string and fragment', () => {
      const service = buildService();
      const state = service.sign({ returnUrl: '/portfolio?type=vendor&filter=urgent' });

      expect(service.verify(state).returnUrl).toBe('/portfolio?type=vendor&filter=urgent');
    });

    it('emits a unique csrf nonce per call', () => {
      const service = buildService();
      const a = service.verify(service.sign({ returnUrl: '/dashboard' }));
      const b = service.verify(service.sign({ returnUrl: '/dashboard' }));

      expect(a.csrf).not.toBe(b.csrf);
    });
  });

  describe('returnUrl sanitisation', () => {
    it('defaults to /dashboard when returnUrl is missing', () => {
      const service = buildService();
      const state = service.sign({ returnUrl: '' });
      expect(service.verify(state).returnUrl).toBe('/dashboard');
    });

    it('rejects external URLs (open redirect protection)', () => {
      const service = buildService();
      const evilState = service.sign({ returnUrl: 'http://evil.com/steal' });
      expect(service.verify(evilState).returnUrl).toBe('/dashboard');
    });

    it('rejects protocol-relative URLs', () => {
      const service = buildService();
      const state = service.sign({ returnUrl: '//evil.com/steal' });
      expect(service.verify(state).returnUrl).toBe('/dashboard');
    });

    it('rejects relative paths without leading slash', () => {
      const service = buildService();
      const state = service.sign({ returnUrl: 'dashboard' });
      expect(service.verify(state).returnUrl).toBe('/dashboard');
    });
  });

  describe('signature verification', () => {
    it('rejects a state token with a tampered payload', () => {
      const service = buildService();
      const state = service.sign({ returnUrl: '/dashboard' });
      const [, sig] = state.split('.');
      const tampered = `tampered.${sig}`;

      expect(() => service.verify(tampered)).toThrow(DomainException);
    });

    it('rejects a state token with a tampered signature', () => {
      const service = buildService();
      const state = service.sign({ returnUrl: '/dashboard' });
      const [payload] = state.split('.');
      const tampered = `${payload}.tampered`;

      expect(() => service.verify(tampered)).toThrow(DomainException);
    });

    it('rejects a state token signed with a different key', () => {
      const a = buildService('secret-A-of-at-least-32-chars-long');
      const b = buildService('secret-B-of-at-least-32-chars-long');

      const state = a.sign({ returnUrl: '/dashboard' });
      expect(() => b.verify(state)).toThrow(DomainException);
    });

    it('rejects a state token missing the separator', () => {
      const service = buildService();
      expect(() => service.verify('not-a-state-token')).toThrow(DomainException);
    });
  });

  describe('expiry', () => {
    it('accepts a state within its TTL', () => {
      const service = buildService();
      const issuedAt = new Date('2026-05-13T12:00:00Z');
      const state = service.sign({ returnUrl: '/dashboard', now: issuedAt });

      // 5 minutes later — within 10-minute TTL
      const checkAt = new Date('2026-05-13T12:05:00Z');
      expect(() => service.verify(state, checkAt)).not.toThrow();
    });

    it('rejects an expired state', () => {
      const service = buildService();
      const issuedAt = new Date('2026-05-13T12:00:00Z');
      const state = service.sign({ returnUrl: '/dashboard', now: issuedAt });

      // 15 minutes later — past 10-minute TTL
      const checkAt = new Date('2026-05-13T12:15:00Z');
      expect(() => service.verify(state, checkAt)).toThrow(/expired/);
    });
  });
});
