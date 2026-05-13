import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { DomainException } from '../../../shared/exceptions/app-error';
import { SessionId } from './value-objects/session-id.vo';
import { UserId } from './value-objects/user-id.vo';
import { EncryptedAccessToken } from './value-objects/encrypted-access-token.vo';
import { EncryptedRefreshToken } from './value-objects/encrypted-refresh-token.vo';
import { EncryptionSalt } from './value-objects/encryption-salt.vo';
import { KeyName } from './value-objects/key-name.vo';
import { SessionExpiry } from './value-objects/session-expiry.vo';
import {
  SessionCreatedEvent,
  SessionRefreshedEvent,
  SessionInvalidatedEvent,
} from './events/session.events';

export type InvalidationReason = 'logout' | 'expired' | 'revoked' | 'replaced';

interface SessionProps {
  userId: UserId;
  encryptedAccessToken: EncryptedAccessToken;
  encryptedRefreshToken: EncryptedRefreshToken;
  encryptionSalt: EncryptionSalt;
  keyName: KeyName;
  expiry: SessionExpiry;
  createdAt: Date;
  updatedAt: Date;
}

export class Session extends AggregateRoot<SessionId> {
  private props: SessionProps;

  constructor(id: SessionId, props: SessionProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    id: SessionId;
    userId: UserId;
    encryptedAccessToken: EncryptedAccessToken;
    encryptedRefreshToken: EncryptedRefreshToken;
    encryptionSalt: EncryptionSalt;
    keyName: KeyName;
    expiry: SessionExpiry;
    now?: Date;
  }): Session {
    const now = params.now ?? new Date();
    const session = new Session(params.id, {
      userId: params.userId,
      encryptedAccessToken: params.encryptedAccessToken,
      encryptedRefreshToken: params.encryptedRefreshToken,
      encryptionSalt: params.encryptionSalt,
      keyName: params.keyName,
      expiry: params.expiry,
      createdAt: now,
      updatedAt: now,
    });
    session.addDomainEvent(
      new SessionCreatedEvent(session.id.value, params.userId.value, params.expiry.expiresAt),
    );
    return session;
  }

  static rehydrate(id: SessionId, props: SessionProps): Session {
    return new Session(id, props);
  }

  // Rotate the encrypted access (and optionally refresh) token after a
  // silent refresh against Auth0. The new ciphertext and expiry are
  // produced by the SessionEncryptionService and Auth0Service.
  refresh(params: {
    encryptedAccessToken: EncryptedAccessToken;
    encryptedRefreshToken?: EncryptedRefreshToken;
    expiry: SessionExpiry;
    now?: Date;
  }): void {
    if (this.isExpired(params.now)) {
      throw new DomainException(
        'SESSION_EXPIRED',
        'Cannot refresh an already-expired session; create a new one instead.',
      );
    }
    const now = params.now ?? new Date();
    this.props.encryptedAccessToken = params.encryptedAccessToken;
    if (params.encryptedRefreshToken) {
      this.props.encryptedRefreshToken = params.encryptedRefreshToken;
    }
    this.props.expiry = params.expiry;
    this.props.updatedAt = now;
    this.addDomainEvent(
      new SessionRefreshedEvent(this.id.value, this.props.userId.value, params.expiry.expiresAt),
    );
  }

  invalidate(reason: InvalidationReason): void {
    this.addDomainEvent(
      new SessionInvalidatedEvent(this.id.value, this.props.userId.value, reason),
    );
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiry.isExpired(now);
  }

  belongsTo(userId: UserId): boolean {
    return this.props.userId.equals(userId);
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get encryptedAccessToken(): EncryptedAccessToken {
    return this.props.encryptedAccessToken;
  }

  get encryptedRefreshToken(): EncryptedRefreshToken {
    return this.props.encryptedRefreshToken;
  }

  get encryptionSalt(): EncryptionSalt {
    return this.props.encryptionSalt;
  }

  get keyName(): KeyName {
    return this.props.keyName;
  }

  get expiry(): SessionExpiry {
    return this.props.expiry;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
