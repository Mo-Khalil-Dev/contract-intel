import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { LoginCommand, LoginResult } from './login.command';
import { USER_REPOSITORY, IUserRepository } from '../../domain/user.repository';
import { SESSION_REPOSITORY, ISessionRepository } from '../../domain/session.repository';
import { OAUTH_PROVIDER, IOAuthProvider } from '../../domain/ports/oauth-provider.port';
import { SESSION_ENCRYPTION, ISessionEncryption } from '../../domain/ports/session-encryption.port';
import { User } from '../../domain/user.aggregate';
import { Session } from '../../domain/session.aggregate';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { SessionId } from '../../domain/value-objects/session-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { Auth0SubjectId } from '../../domain/value-objects/auth0-subject-id.vo';
import { EncryptedAccessToken } from '../../domain/value-objects/encrypted-access-token.vo';
import { EncryptedRefreshToken } from '../../domain/value-objects/encrypted-refresh-token.vo';
import { EncryptionSalt } from '../../domain/value-objects/encryption-salt.vo';
import { KeyName } from '../../domain/value-objects/key-name.vo';
import { SessionExpiry } from '../../domain/value-objects/session-expiry.vo';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResult> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(OAUTH_PROVIDER) private readonly oauth: IOAuthProvider,
    @Inject(SESSION_ENCRYPTION) private readonly encryption: ISessionEncryption,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    // 1. Exchange the Auth0 authorization code for tokens + user info.
    const { tokens, userInfo } = await this.oauth.exchangeCodeForTokens(
      command.authorizationCode,
      command.redirectUri,
    );

    // 2. Find or create the User aggregate.
    const auth0SubjectId = Auth0SubjectId.fromString(userInfo.subjectId);
    let user = await this.users.findByAuth0SubjectId(auth0SubjectId);

    if (!user) {
      user = User.create({
        id: UserId.create(),
        email: Email.create(userInfo.email),
        auth0SubjectId,
        displayName: userInfo.displayName,
      });
    }

    user.recordLogin({
      ipAddress: command.context.ipAddress,
      userAgent: command.context.userAgent,
    });
    await this.users.save(user);

    // 3. Encrypt the tokens and create a Session aggregate.
    const accessPayload = await this.encryption.encrypt(tokens.accessToken);
    const refreshPayload = await this.encryption.encrypt(tokens.refreshToken);

    // The encryption service guarantees salt + keyName are the same for
    // both encrypts within one call cycle (per-session derivation), so we
    // store the access-token's salt/keyName on the session.
    const session = Session.create({
      id: SessionId.create(),
      userId: user.id,
      encryptedAccessToken: EncryptedAccessToken.fromCiphertext(accessPayload.ciphertext),
      encryptedRefreshToken: EncryptedRefreshToken.fromCiphertext(refreshPayload.ciphertext),
      encryptionSalt: EncryptionSalt.fromString(accessPayload.salt),
      keyName: KeyName.fromString(accessPayload.keyName),
      expiry: SessionExpiry.fromTtlSeconds(tokens.expiresInSeconds),
    });

    await this.sessions.save(session);

    // 4. Publish all aggregate events.
    this.eventBus.publishAll([...user.pullDomainEvents(), ...session.pullDomainEvents()]);

    return {
      sessionId: session.id.value,
      userId: user.id.value,
      email: user.email.value,
      displayName: user.displayName,
      role: user.role.value,
      expiresAt: session.expiry.expiresAt,
    };
  }
}
