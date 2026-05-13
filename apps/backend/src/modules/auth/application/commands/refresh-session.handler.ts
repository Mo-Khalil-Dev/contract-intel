import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RefreshSessionCommand, RefreshSessionResult } from './refresh-session.command';
import { SESSION_REPOSITORY, ISessionRepository } from '../../domain/session.repository';
import { OAUTH_PROVIDER, IOAuthProvider } from '../../domain/ports/oauth-provider.port';
import { SESSION_ENCRYPTION, ISessionEncryption } from '../../domain/ports/session-encryption.port';
import { SessionId } from '../../domain/value-objects/session-id.vo';
import { EncryptedAccessToken } from '../../domain/value-objects/encrypted-access-token.vo';
import { EncryptedRefreshToken } from '../../domain/value-objects/encrypted-refresh-token.vo';
import { SessionExpiry } from '../../domain/value-objects/session-expiry.vo';
import { NotFoundException, UnauthorizedException } from '../../../../shared/exceptions/app-error';

@CommandHandler(RefreshSessionCommand)
export class RefreshSessionHandler implements ICommandHandler<
  RefreshSessionCommand,
  RefreshSessionResult
> {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(OAUTH_PROVIDER) private readonly oauth: IOAuthProvider,
    @Inject(SESSION_ENCRYPTION) private readonly encryption: ISessionEncryption,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RefreshSessionCommand): Promise<RefreshSessionResult> {
    const sessionId = SessionId.fromString(command.sessionId);
    const session = await this.sessions.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${command.sessionId} not found`);
    }

    if (session.isExpired()) {
      // An expired session cannot be silently refreshed — force a fresh
      // login flow at the controller level.
      throw new UnauthorizedException('Session expired; please log in again');
    }

    // 1. Decrypt the stored refresh token.
    const refreshTokenPlain = await this.encryption.decrypt({
      ciphertext: session.encryptedRefreshToken.ciphertext,
      salt: session.encryptionSalt.value,
      keyName: session.keyName.value,
    });

    // 2. Exchange the refresh token at the OAuth provider.
    const refreshed = await this.oauth.refreshTokens(refreshTokenPlain);

    // 3. Encrypt the new access token (and refresh token if rotated).
    const newAccess = await this.encryption.encrypt(refreshed.accessToken);
    const newRefresh = refreshed.refreshToken
      ? await this.encryption.encrypt(refreshed.refreshToken)
      : undefined;

    // 4. Update the session aggregate.
    session.refresh({
      encryptedAccessToken: EncryptedAccessToken.fromCiphertext(newAccess.ciphertext),
      encryptedRefreshToken: newRefresh
        ? EncryptedRefreshToken.fromCiphertext(newRefresh.ciphertext)
        : undefined,
      expiry: SessionExpiry.fromTtlSeconds(refreshed.expiresInSeconds),
    });

    await this.sessions.save(session);
    this.eventBus.publishAll(session.pullDomainEvents());

    return {
      sessionId: session.id.value,
      expiresAt: session.expiry.expiresAt,
    };
  }
}
