import { Injectable, Logger } from '@nestjs/common';
import {
  IOAuthProvider,
  OAuthExchangeResult,
  OAuthRefreshResult,
} from '../domain/ports/oauth-provider.port';

// Dev-only OAuth adapter. Skips the external IdP entirely: the authorize
// URL redirects the browser straight back to the frontend callback with a
// dummy code and the real signed state, so the normal callback POST still
// runs (state verification, session creation, cookie). Wired in only when
// AUTH_DRIVER=dev — never in production (guarded in auth.module).
@Injectable()
export class DevOAuthProvider implements IOAuthProvider {
  private readonly logger = new Logger(DevOAuthProvider.name);

  // A fixed local user. Stable subjectId so repeat logins resolve to the
  // same User aggregate row.
  private static readonly DEV_USER = {
    subjectId: 'dev|local-user',
    email: 'dev@example.com',
    displayName: 'Local Dev User',
    emailVerified: true,
  };

  buildAuthorizeUrl(params: { state: string; redirectUri: string; scope?: string }): string {
    this.logger.warn(
      'AUTH_DRIVER=dev — bypassing Auth0 and logging in a fixed local user. Do NOT use in production.',
    );
    const query = new URLSearchParams({ code: 'dev-auth-code', state: params.state });
    return `${params.redirectUri}?${query.toString()}`;
  }

  async exchangeCodeForTokens(): Promise<OAuthExchangeResult> {
    return {
      tokens: {
        accessToken: 'dev-access-token',
        refreshToken: 'dev-refresh-token',
        expiresInSeconds: 3600,
      },
      userInfo: { ...DevOAuthProvider.DEV_USER },
    };
  }

  async refreshTokens(): Promise<OAuthRefreshResult> {
    return {
      accessToken: 'dev-access-token',
      refreshToken: 'dev-refresh-token',
      expiresInSeconds: 3600,
    };
  }

  async revokeRefreshToken(): Promise<void> {
    // No-op — nothing to revoke against a real IdP.
  }
}
