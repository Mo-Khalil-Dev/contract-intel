import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from '../../config/app-config.module';

// Domain ports
import { USER_REPOSITORY } from './domain/user.repository';
import { SESSION_REPOSITORY } from './domain/session.repository';
import { OAUTH_PROVIDER } from './domain/ports/oauth-provider.port';
import { SESSION_ENCRYPTION } from './domain/ports/session-encryption.port';

// Application handlers
import { LoginHandler } from './application/commands/login.handler';
import { LogoutHandler } from './application/commands/logout.handler';
import { RefreshSessionHandler } from './application/commands/refresh-session.handler';
import { GetCurrentUserHandler } from './application/queries/get-current-user.handler';
import { ValidateSessionHandler } from './application/queries/validate-session.handler';
import { UserLoggedInHandler } from './application/events/user-logged-in.handler';
import { SessionInvalidatedHandler } from './application/events/session-invalidated.handler';

// Infrastructure adapters + controller + guard
import { Auth0Service } from './infrastructure/auth0.service';
import { DevOAuthProvider } from './infrastructure/dev-oauth-provider';
import { AppConfigService } from '../../config/app-config.service';
import { AuthDriver, NodeEnv } from '../../config/environment-variables';
import { SessionEncryptionService } from './infrastructure/session-encryption.service';
import { SessionCookieService } from './infrastructure/session-cookie.service';
import { StateTokenService } from './infrastructure/state-token.service';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { PrismaSessionRepository } from './infrastructure/prisma-session.repository';
import { SessionAuthGuard } from './infrastructure/guards/session-auth.guard';
import { AuthController } from './infrastructure/auth.controller';

const COMMAND_HANDLERS = [LoginHandler, LogoutHandler, RefreshSessionHandler];
const QUERY_HANDLERS = [GetCurrentUserHandler, ValidateSessionHandler];
const EVENT_HANDLERS = [UserLoggedInHandler, SessionInvalidatedHandler];

@Module({
  imports: [CqrsModule, AppConfigModule],
  controllers: [AuthController],
  providers: [
    // CQRS handlers
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...EVENT_HANDLERS,

    // Infrastructure adapters wired to domain ports.
    // OAuth provider is chosen at boot: real Auth0 by default, or a
    // dev-only bypass when AUTH_DRIVER=dev (refused in production).
    Auth0Service,
    DevOAuthProvider,
    {
      provide: OAUTH_PROVIDER,
      inject: [AppConfigService, Auth0Service, DevOAuthProvider],
      useFactory: (config: AppConfigService, auth0: Auth0Service, dev: DevOAuthProvider) => {
        if (config.authDriver === AuthDriver.Dev) {
          if (config.nodeEnv === NodeEnv.Production) {
            throw new Error('AUTH_DRIVER=dev is not allowed when NODE_ENV=production');
          }
          return dev;
        }
        return auth0;
      },
    },
    { provide: SESSION_ENCRYPTION, useClass: SessionEncryptionService },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },

    // Stateless infrastructure services
    SessionCookieService,
    StateTokenService,

    // Global guard — enforces auth on every route unless @Public()
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
  ],
  exports: [SessionCookieService, USER_REPOSITORY],
})
export class AuthModule {}
