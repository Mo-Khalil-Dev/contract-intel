export const OAUTH_PROVIDER = Symbol('OAUTH_PROVIDER');

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface OAuthUserInfo {
  subjectId: string; // e.g. "auth0|abc123"
  email: string;
  displayName: string;
  emailVerified?: boolean;
  picture?: string;
}

export interface OAuthExchangeResult {
  tokens: OAuthTokens;
  userInfo: OAuthUserInfo;
}

export interface OAuthRefreshResult {
  accessToken: string;
  refreshToken?: string; // present only when the provider rotates the refresh token
  expiresInSeconds: number;
}

// Port abstracting the OAuth2 / OIDC provider (Auth0 in production).
// Lives in the domain layer so handlers depend on the contract, not the
// concrete SDK.
export interface IOAuthProvider {
  exchangeCodeForTokens(
    authorizationCode: string,
    redirectUri: string,
  ): Promise<OAuthExchangeResult>;
  refreshTokens(refreshToken: string): Promise<OAuthRefreshResult>;
  revokeRefreshToken(refreshToken: string): Promise<void>;
}
