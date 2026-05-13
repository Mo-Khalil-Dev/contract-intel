import {
  IOAuthProvider,
  OAuthExchangeResult,
  OAuthRefreshResult,
} from '../domain/ports/oauth-provider.port';

export interface FakeOAuthProviderOptions {
  exchange?: OAuthExchangeResult;
  exchangeError?: Error;
  refresh?: OAuthRefreshResult;
  refreshError?: Error;
  revokeError?: Error;
}

export class FakeOAuthProvider implements IOAuthProvider {
  exchangeCalls: { code: string; redirectUri: string }[] = [];
  refreshCalls: string[] = [];
  revokeCalls: string[] = [];
  authorizeUrlCalls: { state: string; redirectUri: string; scope?: string }[] = [];

  constructor(private options: FakeOAuthProviderOptions = {}) {}

  buildAuthorizeUrl(params: { state: string; redirectUri: string; scope?: string }): string {
    this.authorizeUrlCalls.push(params);
    const query = new URLSearchParams({
      response_type: 'code',
      state: params.state,
      redirect_uri: params.redirectUri,
      scope: params.scope ?? 'openid profile email offline_access',
    });
    return `https://fake-auth0/authorize?${query.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthExchangeResult> {
    this.exchangeCalls.push({ code, redirectUri });
    if (this.options.exchangeError) throw this.options.exchangeError;
    return (
      this.options.exchange ?? {
        tokens: { accessToken: 'access-1', refreshToken: 'refresh-1', expiresInSeconds: 3600 },
        userInfo: {
          subjectId: 'auth0|user-1',
          email: 'alice@example.com',
          displayName: 'Alice',
        },
      }
    );
  }

  async refreshTokens(refreshToken: string): Promise<OAuthRefreshResult> {
    this.refreshCalls.push(refreshToken);
    if (this.options.refreshError) throw this.options.refreshError;
    return (
      this.options.refresh ?? {
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
        expiresInSeconds: 3600,
      }
    );
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    this.revokeCalls.push(refreshToken);
    if (this.options.revokeError) throw this.options.revokeError;
  }
}
