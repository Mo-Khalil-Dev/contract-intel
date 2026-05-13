import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { AppConfigService } from '../../../config/app-config.service';
import { DomainException } from '../../../shared/exceptions/app-error';

interface StatePayload {
  csrf: string; // random nonce
  returnUrl: string; // post-login redirect path
  iat: number; // issued-at, seconds since epoch
  exp: number; // expires-at, seconds since epoch
}

const STATE_TTL_SECONDS = 600; // 10 minutes — Auth0 flow should never take longer

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): Buffer {
  const pad = '='.repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

// Service that signs and verifies the OAuth state parameter.
//
// Format: `${base64url(JSON(payload))}.${base64url(HMAC-SHA256(payload))}`
// Confidentiality is not required (Auth0 echoes state verbatim), only
// integrity. We use HMAC with SESSION_SECRET as the signing key.
@Injectable()
export class StateTokenService {
  constructor(private readonly config: AppConfigService) {}

  sign(params: { returnUrl: string; now?: Date }): string {
    const nowSeconds = Math.floor((params.now ?? new Date()).getTime() / 1000);
    const payload: StatePayload = {
      csrf: randomBytes(16).toString('hex'),
      returnUrl: this.sanitizeReturnUrl(params.returnUrl),
      iat: nowSeconds,
      exp: nowSeconds + STATE_TTL_SECONDS,
    };

    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = this.hmac(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  verify(state: string, now: Date = new Date()): StatePayload {
    if (typeof state !== 'string' || !state.includes('.')) {
      throw new DomainException('INVALID_STATE', 'State token is malformed');
    }

    const [encodedPayload, signature] = state.split('.', 2);
    const expectedSignature = this.hmac(encodedPayload);

    if (!this.constantTimeEqual(signature, expectedSignature)) {
      throw new DomainException('INVALID_STATE', 'State token signature is invalid');
    }

    let payload: StatePayload;
    try {
      payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as StatePayload;
    } catch {
      throw new DomainException('INVALID_STATE', 'State token payload is not valid JSON');
    }

    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < nowSeconds) {
      throw new DomainException('INVALID_STATE', 'State token has expired');
    }

    return payload;
  }

  private hmac(encodedPayload: string): string {
    return base64UrlEncode(
      createHmac('sha256', this.config.sessionSecret).update(encodedPayload).digest(),
    );
  }

  private constantTimeEqual(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  }

  // Only allow same-origin paths (no protocol, no host) to prevent open
  // redirect via attacker-controlled returnUrl. Defaults to '/dashboard'.
  private sanitizeReturnUrl(raw: string | undefined): string {
    if (typeof raw !== 'string' || raw.length === 0) return '/dashboard';
    if (!raw.startsWith('/')) return '/dashboard';
    if (raw.startsWith('//')) return '/dashboard'; // protocol-relative URL
    return raw;
  }
}
