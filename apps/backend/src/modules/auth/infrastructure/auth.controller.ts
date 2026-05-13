import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { AppConfigService } from '../../../config/app-config.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser, RequestUser } from './decorators/current-user.decorator';
import { SessionCookieService } from './session-cookie.service';
import { StateTokenService } from './state-token.service';
import { CallbackRequestDto, CallbackResponse } from './dtos/callback.dto';
import { CurrentUserResponseDto } from './dtos/current-user.response.dto';
import { IOAuthProvider, OAUTH_PROVIDER } from '../domain/ports/oauth-provider.port';
import { LoginCommand, LoginResult } from '../application/commands/login.command';
import { LogoutCommand } from '../application/commands/logout.command';
import {
  CurrentUserView,
  GetCurrentUserQuery,
} from '../application/queries/get-current-user.query';
import { UnauthorizedException } from '../../../shared/exceptions/app-error';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject(OAUTH_PROVIDER) private readonly oauth: IOAuthProvider,
    private readonly stateTokens: StateTokenService,
    private readonly cookies: SessionCookieService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly config: AppConfigService,
  ) {}

  // Step 1: User hits a protected route, gets 401, axios interceptor sends
  // them here. We mint a signed state (CSRF + returnUrl) and redirect to
  // Auth0 Universal Login.
  @Public()
  @Get('login')
  login(@Query('returnUrl') returnUrl: string | undefined, @Res() res: Response): void {
    const state = this.stateTokens.sign({ returnUrl: returnUrl ?? '/dashboard' });
    const authorizeUrl = this.oauth.buildAuthorizeUrl({
      state,
      redirectUri: this.frontendCallbackUrl(),
    });
    res.redirect(authorizeUrl);
  }

  // Step 2: The frontend callback page POSTs the code + state here after
  // Auth0 redirects to /auth/callback in the frontend. We verify state,
  // exchange the code, store the session, set the cookie, and return the
  // returnUrl so the frontend can router.push() to it.
  @Public()
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async callback(
    @Body() body: CallbackRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CallbackResponse> {
    let stateData: { returnUrl: string };
    try {
      stateData = this.stateTokens.verify(body.state);
    } catch (error) {
      this.logger.warn(`State verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired state token');
    }

    const result = await this.commandBus.execute<LoginCommand, LoginResult>(
      new LoginCommand(body.code, this.frontendCallbackUrl(), {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }),
    );

    const ttlSeconds = Math.max(1, Math.floor((result.expiresAt.getTime() - Date.now()) / 1000));
    this.cookies.set(res, result.sessionId, ttlSeconds);

    return { returnUrl: stateData.returnUrl };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: RequestUser | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (user) {
      try {
        await this.commandBus.execute(new LogoutCommand(user.sessionId));
      } catch (error) {
        // Log and continue — we still want to clear the cookie even if the
        // server-side session cleanup fails for some reason.
        this.logger.warn(
          `Logout cleanup failed for session ${user.sessionId}: ${(error as Error).message}`,
        );
      }
    }
    this.cookies.clear(res);
  }

  @Get('me')
  async me(@CurrentUser() user: RequestUser | undefined): Promise<CurrentUserResponseDto> {
    if (!user) {
      throw new UnauthorizedException('No authenticated user');
    }

    const view = await this.queryBus.execute<GetCurrentUserQuery, CurrentUserView>(
      new GetCurrentUserQuery(user.userId),
    );

    return {
      userId: view.userId,
      email: view.email,
      displayName: view.displayName,
      role: view.role,
      lastLoginAt: view.lastLoginAt ? view.lastLoginAt.toISOString() : null,
    };
  }

  private frontendCallbackUrl(): string {
    return `${this.config.frontendUrl.replace(/\/$/, '')}/auth/callback`;
  }
}
