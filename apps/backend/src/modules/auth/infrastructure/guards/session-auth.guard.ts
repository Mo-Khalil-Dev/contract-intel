import { CanActivate, ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SessionCookieService } from '../session-cookie.service';
import { ISessionRepository, SESSION_REPOSITORY } from '../../domain/session.repository';
import { IUserRepository, USER_REPOSITORY } from '../../domain/user.repository';
import { SessionId } from '../../domain/value-objects/session-id.vo';
import { RefreshSessionCommand } from '../../application/commands/refresh-session.command';
import { UnauthorizedException } from '../../../../shared/exceptions/app-error';
import { RequestUser } from '../decorators/current-user.decorator';

const REFRESH_THRESHOLD_SECONDS = 60; // proactively refresh if < 60 s left

@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly logger = new Logger(SessionAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cookies: SessionCookieService,
    private readonly commandBus: CommandBus,
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const sessionIdRaw = this.cookies.read(request);

    if (!sessionIdRaw) {
      throw new UnauthorizedException('No session cookie');
    }

    let sessionId: SessionId;
    try {
      sessionId = SessionId.fromString(sessionIdRaw);
    } catch {
      throw new UnauthorizedException('Malformed session id');
    }

    let session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.isExpired()) {
      // Try a silent refresh. If it fails the caller gets 401 and the
      // axios interceptor will redirect to /auth/login.
      try {
        await this.commandBus.execute(new RefreshSessionCommand(sessionId.value));
        session = await this.sessions.findById(sessionId);
        if (!session) throw new UnauthorizedException('Session vanished after refresh');
      } catch (error) {
        this.logger.warn(
          `Silent refresh failed for session ${sessionId.value}: ${(error as Error).message}`,
        );
        throw new UnauthorizedException('Session expired and refresh failed');
      }
    } else if (session.expiry.secondsUntilExpiry() < REFRESH_THRESHOLD_SECONDS) {
      // Proactive refresh near expiry — best-effort, ignore failures.
      try {
        await this.commandBus.execute(new RefreshSessionCommand(sessionId.value));
        const refreshed = await this.sessions.findById(sessionId);
        if (refreshed) session = refreshed;
      } catch (error) {
        this.logger.warn(
          `Proactive refresh failed for session ${sessionId.value}: ${(error as Error).message}`,
        );
      }
    }

    const user = await this.users.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User for session not found');
    }

    request.user = {
      userId: user.id.value,
      sessionId: session.id.value,
      email: user.email.value,
      role: user.role.value,
    };

    return true;
  }
}
