import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AuthModule } from '../auth.module';
import { AppConfigModule } from '../../../config/app-config.module';
import { OAUTH_PROVIDER } from '../domain/ports/oauth-provider.port';
import { SESSION_ENCRYPTION } from '../domain/ports/session-encryption.port';
import { USER_REPOSITORY } from '../domain/user.repository';
import { SESSION_REPOSITORY } from '../domain/session.repository';
import { FakeOAuthProvider } from '../test/fake-oauth-provider';
import { FakeSessionEncryption } from '../test/fake-session-encryption';
import { InMemoryUserRepository } from '../test/in-memory-user.repository';
import { InMemorySessionRepository } from '../test/in-memory-session.repository';
import { StateTokenService } from './state-token.service';
import { SESSION_COOKIE_NAME } from './session-cookie.service';
import { HttpExceptionFilter } from '../../../shared/exceptions/http-exception.filter';
import { ResponseInterceptor } from '../../../shared/infrastructure/interceptors/response.interceptor';

const extractCookie = (cookieHeader: string | string[] | undefined): string | null => {
  if (!cookieHeader) return null;
  const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
  const match = cookies.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!match) return null;
  return match.split(';')[0];
};

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let oauth: FakeOAuthProvider;
  let stateTokens: StateTokenService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule, AuthModule],
    })
      .overrideProvider(OAUTH_PROVIDER)
      .useValue(new FakeOAuthProvider())
      .overrideProvider(SESSION_ENCRYPTION)
      .useValue(new FakeSessionEncryption())
      .overrideProvider(USER_REPOSITORY)
      .useValue(new InMemoryUserRepository())
      .overrideProvider(SESSION_REPOSITORY)
      .useValue(new InMemorySessionRepository())
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api/v1');
    await app.init();

    oauth = moduleRef.get<FakeOAuthProvider>(OAUTH_PROVIDER);
    stateTokens = moduleRef.get(StateTokenService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /auth/login', () => {
    it('redirects to the OAuth provider with a signed state', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/login?returnUrl=/dashboard')
        .expect(302);

      const location = response.headers.location;
      expect(location).toContain('https://fake-auth0/authorize');
      expect(oauth.authorizeUrlCalls).toHaveLength(1);
      const state = oauth.authorizeUrlCalls[0].state;
      expect(stateTokens.verify(state).returnUrl).toBe('/dashboard');
    });

    it('uses the frontend callback URL as the redirect_uri', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/login').expect(302);

      const redirectUri = oauth.authorizeUrlCalls[0].redirectUri;
      // Default FRONTEND_URL in .env.test is http://localhost:5173
      expect(redirectUri).toMatch(/\/auth\/callback$/);
    });

    it('defaults returnUrl to /dashboard when none provided', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/login').expect(302);
      expect(stateTokens.verify(oauth.authorizeUrlCalls[0].state).returnUrl).toBe('/dashboard');
    });
  });

  describe('POST /auth/callback', () => {
    it('exchanges the code, sets a session cookie, and returns returnUrl', async () => {
      const state = stateTokens.sign({ returnUrl: '/portfolio' });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/callback')
        .send({ code: 'auth0-code-123', state })
        .expect(200);

      expect(response.body.data.returnUrl).toBe('/portfolio');
      const cookie = extractCookie(response.headers['set-cookie']);
      expect(cookie).not.toBeNull();
      expect(cookie!.startsWith(`${SESSION_COOKIE_NAME}=`)).toBe(true);
    });

    it('rejects an invalid state token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/callback')
        .send({ code: 'auth0-code-123', state: 'totally-bogus' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('UNAUTHORIZED');
    });

    it('rejects missing fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/callback')
        .send({ code: 'only-code' })
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 when no session cookie is present', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('returns the current user when authenticated', async () => {
      // First, complete a callback to establish a session cookie.
      const state = stateTokens.sign({ returnUrl: '/dashboard' });
      const cbResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/callback')
        .send({ code: 'code-123', state })
        .expect(200);

      const cookie = extractCookie(cbResponse.headers['set-cookie'])!;

      const meResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', cookie)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data.email).toBe('alice@example.com');
      expect(meResponse.body.data.displayName).toBe('Alice');
      expect(meResponse.body.data.role).toBe('REVIEWER');
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 401 when called without a session', async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/logout').expect(401);
    });

    it('clears the session cookie and revokes the refresh token', async () => {
      const state = stateTokens.sign({ returnUrl: '/dashboard' });
      const cbResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/callback')
        .send({ code: 'code-123', state })
        .expect(200);

      const cookie = extractCookie(cbResponse.headers['set-cookie'])!;

      const logoutResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', cookie)
        .expect(204);

      const clearedCookie = extractCookie(logoutResponse.headers['set-cookie']);
      // After clearing, the cookie value is empty.
      expect(clearedCookie).toBe(`${SESSION_COOKIE_NAME}=`);

      // Subsequent /me with the (now-deleted-on-server) cookie should 401.
      await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', cookie).expect(401);
    });
  });
});
