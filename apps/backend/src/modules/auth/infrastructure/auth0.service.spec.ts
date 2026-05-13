import { Auth0Service } from './auth0.service';
import { AppConfigService } from '../../../config/app-config.service';
import { InfrastructureException } from '../../../shared/exceptions/app-error';

const buildService = (overrides: Partial<AppConfigService> = {}): Auth0Service =>
  new Auth0Service({
    auth0Domain: 'example.auth0.com',
    auth0ClientId: 'client-id-123',
    auth0ClientSecret: 'super-secret',
    auth0CallbackUrl: 'http://localhost:3000/api/v1/auth/callback',
    ...overrides,
  } as AppConfigService);

describe('Auth0Service.buildAuthorizeUrl', () => {
  it('builds an authorize URL with the required query params', () => {
    const url = buildService().buildAuthorizeUrl({
      state: 'state-123',
      redirectUri: 'http://localhost:5173/auth/callback',
    });

    expect(url.startsWith('https://example.auth0.com/authorize?')).toBe(true);
    expect(url).toContain('response_type=code');
    expect(url).toContain('client_id=client-id-123');
    expect(url).toContain('state=state-123');
    expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauth%2Fcallback');
  });

  it('uses the offline_access default scope so we get a refresh token', () => {
    const url = buildService().buildAuthorizeUrl({
      state: 'state-123',
      redirectUri: 'http://localhost:5173/auth/callback',
    });
    expect(url).toContain('scope=openid+profile+email+offline_access');
  });

  it('honors a custom scope', () => {
    const url = buildService().buildAuthorizeUrl({
      state: 'state-123',
      redirectUri: 'http://localhost:5173/auth/callback',
      scope: 'openid email',
    });
    expect(url).toContain('scope=openid+email');
  });

  it('rejects when AUTH0_CLIENT_ID is missing', () => {
    expect(() =>
      buildService({ auth0ClientId: '' }).buildAuthorizeUrl({
        state: 's',
        redirectUri: 'http://localhost:5173/auth/callback',
      }),
    ).toThrow(/AUTH0_CLIENT_ID/);
  });

  it('rejects when AUTH0_DOMAIN is missing', () => {
    expect(() =>
      buildService({ auth0Domain: '' }).buildAuthorizeUrl({
        state: 's',
        redirectUri: 'http://localhost:5173/auth/callback',
      }),
    ).toThrow(/AUTH0_DOMAIN/);
  });
});

describe('Auth0Service.exchangeCodeForTokens', () => {
  let fetchMock: jest.SpyInstance;

  const mockOk = <T>(body: T): Response =>
    ({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    }) as unknown as Response;

  const mockError = (status: number, body: string): Response =>
    ({
      ok: false,
      status,
      json: () => Promise.resolve({ error: body }),
      text: () => Promise.resolve(body),
    }) as unknown as Response;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('exchanges code → returns tokens + userInfo', async () => {
    fetchMock.mockImplementation((input: unknown) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/oauth/token')) {
        return Promise.resolve(
          mockOk({
            access_token: 'access-1',
            refresh_token: 'refresh-1',
            expires_in: 3600,
            token_type: 'Bearer',
          }),
        );
      }
      if (url.includes('/userinfo')) {
        return Promise.resolve(
          mockOk({
            sub: 'auth0|user-1',
            email: 'alice@example.com',
            name: 'Alice',
            email_verified: true,
          }),
        );
      }
      return Promise.resolve(mockError(404, 'not found'));
    });

    const result = await buildService().exchangeCodeForTokens('code-123', 'http://callback');

    expect(result.tokens.accessToken).toBe('access-1');
    expect(result.tokens.refreshToken).toBe('refresh-1');
    expect(result.tokens.expiresInSeconds).toBe(3600);
    expect(result.userInfo.subjectId).toBe('auth0|user-1');
    expect(result.userInfo.email).toBe('alice@example.com');
    expect(result.userInfo.displayName).toBe('Alice');
    expect(result.userInfo.emailVerified).toBe(true);
  });

  it('throws when Auth0 omits a refresh_token (offline_access not configured)', async () => {
    fetchMock.mockResolvedValueOnce(
      mockOk({ access_token: 'access-1', expires_in: 3600, token_type: 'Bearer' }),
    );

    await expect(
      buildService().exchangeCodeForTokens('code-123', 'http://callback'),
    ).rejects.toThrow(/refresh_token/);
  });

  it('propagates Auth0 4xx errors as InfrastructureException', async () => {
    fetchMock.mockResolvedValueOnce(mockError(400, 'invalid_grant'));

    await expect(
      buildService().exchangeCodeForTokens('bad-code', 'http://callback'),
    ).rejects.toThrow(InfrastructureException);
  });
});
