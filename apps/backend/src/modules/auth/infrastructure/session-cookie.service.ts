import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { AppConfigService } from '../../../config/app-config.service';

export const SESSION_COOKIE_NAME = 'cisid';

interface CookieAttrs {
  httpOnly: true;
  secure: boolean;
  sameSite: 'strict';
  path: '/';
  maxAge?: number;
}

// Signs and verifies the session cookie. The cookie payload is just the
// session id; the encrypted Auth0 tokens live in the database (referenced
// by that session id).
//
// Format: `${sessionId}.${HMAC-SHA256(sessionId)}` base64-url encoded.
@Injectable()
export class SessionCookieService {
  constructor(private readonly config: AppConfigService) {}

  set(res: Response, sessionId: string, ttlSeconds: number): void {
    const signed = this.sign(sessionId);
    res.cookie(SESSION_COOKIE_NAME, signed, this.attrs(ttlSeconds));
  }

  clear(res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME, this.attrs());
  }

  read(req: Request): string | null {
    const raw = (req.cookies as Record<string, unknown> | undefined)?.[SESSION_COOKIE_NAME];
    if (typeof raw !== 'string' || raw.length === 0) return null;

    const [sessionId, signature] = raw.split('.', 2);
    if (!sessionId || !signature) return null;

    const expected = this.signature(sessionId);
    if (!this.constantTimeEqual(signature, expected)) return null;

    return sessionId;
  }

  private sign(sessionId: string): string {
    return `${sessionId}.${this.signature(sessionId)}`;
  }

  private signature(sessionId: string): string {
    return createHmac('sha256', this.config.sessionSecret).update(sessionId).digest('base64url');
  }

  private attrs(maxAgeSeconds?: number): CookieAttrs {
    return {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'strict',
      path: '/',
      ...(maxAgeSeconds !== undefined ? { maxAge: maxAgeSeconds * 1000 } : {}),
    };
  }

  private constantTimeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  }
}
