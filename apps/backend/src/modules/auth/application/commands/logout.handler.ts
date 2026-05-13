import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { LogoutCommand } from './logout.command';
import { USER_REPOSITORY, IUserRepository } from '../../domain/user.repository';
import { SESSION_REPOSITORY, ISessionRepository } from '../../domain/session.repository';
import { OAUTH_PROVIDER, IOAuthProvider } from '../../domain/ports/oauth-provider.port';
import { SESSION_ENCRYPTION, ISessionEncryption } from '../../domain/ports/session-encryption.port';
import { SessionId } from '../../domain/value-objects/session-id.vo';
import { NotFoundException } from '../../../../shared/exceptions/app-error';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, void> {
  private readonly logger = new Logger(LogoutHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(OAUTH_PROVIDER) private readonly oauth: IOAuthProvider,
    @Inject(SESSION_ENCRYPTION) private readonly encryption: ISessionEncryption,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const sessionId = SessionId.fromString(command.sessionId);
    const session = await this.sessions.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${command.sessionId} not found`);
    }

    // Best-effort revocation of the refresh token at the OAuth provider.
    // We swallow provider failures because the local session is being
    // invalidated regardless — leaving a token un-revoked at Auth0 is
    // less bad than blocking the user from logging out.
    try {
      const refreshToken = await this.encryption.decrypt({
        ciphertext: session.encryptedRefreshToken.ciphertext,
        salt: session.encryptionSalt.value,
        keyName: session.keyName.value,
      });
      await this.oauth.revokeRefreshToken(refreshToken);
    } catch (error) {
      this.logger.warn(
        `Refresh-token revocation at OAuth provider failed for session ${command.sessionId}: ${(error as Error).message}`,
      );
    }

    // Invalidate the session (emits SessionInvalidatedEvent) and delete.
    session.invalidate('logout');
    const user = await this.users.findById(session.userId);
    if (user) {
      user.recordLogout(session.id.value);
    }

    await this.sessions.delete(sessionId);

    this.eventBus.publishAll([
      ...session.pullDomainEvents(),
      ...(user ? user.pullDomainEvents() : []),
    ]);
  }
}
