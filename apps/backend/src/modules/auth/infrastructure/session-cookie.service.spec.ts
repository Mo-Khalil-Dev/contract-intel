import { Request, Response } from 'express';
import { SESSION_COOKIE_NAME, SessionCookieService } from './session-cookie.service';
import { AppConfigService } from '../../../config/app-config.service';

const buildService = (overrides: Partial<AppConfigService> = {}) =>
  new SessionCookieService({
    sessionSecret: 'a-valid-session-secret-of-32-chars-long',
    isProduction: false,
    ...overrides,
  } as AppConfigService);

const fakeRes = () => {
  const res = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response & { cookie: jest.Mock; clearCookie: jest.Mock };
  return res;
};

const fakeReq = (cookies: Record<string, string> = {}) => ({ cookies }) as unknown as Request;

describe('SessionCookieService', () => {
  describe('set', () => {
    it('sets a signed cookie with the session id', () => {
      const service = buildService();
      const res = fakeRes();

      service.set(res, 'session-abc', 3600);

      const [name, value, attrs] = res.cookie.mock.calls[0];
      expect(name).toBe(SESSION_COOKIE_NAME);
      expect(value.startsWith('session-abc.')).toBe(true);
      expect(attrs.httpOnly).toBe(true);
      expect(attrs.sameSite).toBe('strict');
      expect(attrs.maxAge).toBe(3_600_000);
    });

    it('flags Secure when running in production', () => {
      const service = buildService({ isProduction: true });
      const res = fakeRes();

      service.set(res, 'session-abc', 3600);

      const attrs = res.cookie.mock.calls[0][2];
      expect(attrs.secure).toBe(true);
    });

    it('does not flag Secure outside of production', () => {
      const service = buildService({ isProduction: false });
      const res = fakeRes();

      service.set(res, 'session-abc', 3600);
      expect(res.cookie.mock.calls[0][2].secure).toBe(false);
    });
  });

  describe('clear', () => {
    it('calls clearCookie with the cookie name and matching attrs', () => {
      const service = buildService();
      const res = fakeRes();

      service.clear(res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        expect.objectContaining({ httpOnly: true, sameSite: 'strict', path: '/' }),
      );
    });
  });

  describe('read', () => {
    it('reads a valid signed cookie back to the session id', () => {
      const service = buildService();
      const res = fakeRes();

      service.set(res, 'session-abc', 3600);
      const signed = res.cookie.mock.calls[0][1];

      expect(service.read(fakeReq({ [SESSION_COOKIE_NAME]: signed }))).toBe('session-abc');
    });

    it('returns null when no cookie is present', () => {
      const service = buildService();
      expect(service.read(fakeReq())).toBeNull();
    });

    it('returns null when the cookie is malformed (no separator)', () => {
      const service = buildService();
      expect(service.read(fakeReq({ [SESSION_COOKIE_NAME]: 'malformed' }))).toBeNull();
    });

    it('returns null when the signature does not match', () => {
      const service = buildService();
      expect(
        service.read(fakeReq({ [SESSION_COOKIE_NAME]: 'session-abc.bogus-signature' })),
      ).toBeNull();
    });

    it('returns null when the cookie was signed with a different secret', () => {
      const a = buildService({ sessionSecret: 'secret-A-of-at-least-32-chars-long' });
      const b = buildService({ sessionSecret: 'secret-B-of-at-least-32-chars-long' });
      const res = fakeRes();

      a.set(res, 'session-abc', 3600);
      const signed = res.cookie.mock.calls[0][1];

      expect(b.read(fakeReq({ [SESSION_COOKIE_NAME]: signed }))).toBeNull();
    });
  });
});
