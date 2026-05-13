import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../../config/app-config.service';
import {
  IOAuthProvider,
  OAuthExchangeResult,
  OAuthRefreshResult,
} from '../domain/ports/oauth-provider.port';
import { InfrastructureException } from '../../../shared/exceptions/app-error';

const DEFAULT_SCOPE = 'openid profile email offline_access';

interface Auth0TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface Auth0UserInfoResponse {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
}

// Adapter implementing IOAuthProvider against Auth0. Uses fetch directly
// (no SDK) — the surface is small enough that the SDK adds more cost than
// value, and using fetch keeps dependencies lean.
@Injectable()
export class Auth0Service implements IOAuthProvider {
  private readonly logger = new Logger(Auth0Service.name);

  constructor(private readonly config: AppConfigService) {}

  buildAuthorizeUrl(params: { state: string; redirectUri: string; scope?: string }): string {
    const search = new URLSearchParams({
      response_type: 'code',
      client_id: this.requireConfig(this.config.auth0ClientId, 'AUTH0_CLIENT_ID'),
      redirect_uri: params.redirectUri,
      scope: params.scope ?? DEFAULT_SCOPE,
      state: params.state,
    });
    return `${this.issuerUrl()}/authorize?${search.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthExchangeResult> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.requireConfig(this.config.auth0ClientId, 'AUTH0_CLIENT_ID'),
      client_secret: this.requireConfig(this.config.auth0ClientSecret, 'AUTH0_CLIENT_SECRET'),
      code,
      redirect_uri: redirectUri,
    });

    const tokenResponse = await this.postForm<Auth0TokenResponse>(
      `${this.issuerUrl()}/oauth/token`,
      body,
      'exchangeCodeForTokens',
    );

    if (!tokenResponse.refresh_token) {
      throw new InfrastructureException(
        'AUTH0_MISSING_REFRESH_TOKEN',
        'Auth0 did not return a refresh_token. Ensure the application has offline_access scope and refresh tokens enabled.',
      );
    }

    const userInfo = await this.fetchUserInfo(tokenResponse.access_token);

    return {
      tokens: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresInSeconds: tokenResponse.expires_in,
      },
      userInfo: {
        subjectId: userInfo.sub,
        email: userInfo.email,
        displayName: userInfo.name ?? userInfo.nickname ?? userInfo.email,
        emailVerified: userInfo.email_verified,
        picture: userInfo.picture,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthRefreshResult> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.requireConfig(this.config.auth0ClientId, 'AUTH0_CLIENT_ID'),
      client_secret: this.requireConfig(this.config.auth0ClientSecret, 'AUTH0_CLIENT_SECRET'),
      refresh_token: refreshToken,
    });

    const response = await this.postForm<Auth0TokenResponse>(
      `${this.issuerUrl()}/oauth/token`,
      body,
      'refreshTokens',
    );

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresInSeconds: response.expires_in,
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const body = new URLSearchParams({
      client_id: this.requireConfig(this.config.auth0ClientId, 'AUTH0_CLIENT_ID'),
      client_secret: this.requireConfig(this.config.auth0ClientSecret, 'AUTH0_CLIENT_SECRET'),
      token: refreshToken,
    });

    const response = await fetch(`${this.issuerUrl()}/oauth/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InfrastructureException(
        'AUTH0_REVOKE_FAILED',
        `Auth0 token revocation failed (status ${response.status}): ${text}`,
      );
    }
  }

  private async fetchUserInfo(accessToken: string): Promise<Auth0UserInfoResponse> {
    const response = await fetch(`${this.issuerUrl()}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InfrastructureException(
        'AUTH0_USERINFO_FAILED',
        `Auth0 /userinfo failed (status ${response.status}): ${text}`,
      );
    }

    return (await response.json()) as Auth0UserInfoResponse;
  }

  private async postForm<T>(url: string, body: URLSearchParams, operation: string): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.warn(`Auth0 ${operation} failed: status=${response.status} body=${text}`);
      throw new InfrastructureException(
        'AUTH0_REQUEST_FAILED',
        `Auth0 ${operation} failed (status ${response.status})`,
      );
    }

    return (await response.json()) as T;
  }

  private issuerUrl(): string {
    const domain = this.requireConfig(this.config.auth0Domain, 'AUTH0_DOMAIN');
    return domain.startsWith('http') ? domain : `https://${domain}`;
  }

  private requireConfig(value: string | undefined, name: string): string {
    if (!value || value.length === 0) {
      throw new InfrastructureException(
        'AUTH0_CONFIG_MISSING',
        `Missing required Auth0 configuration: ${name}`,
      );
    }
    return value;
  }
}
