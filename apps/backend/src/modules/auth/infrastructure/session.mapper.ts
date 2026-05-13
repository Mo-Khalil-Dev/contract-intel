import { Session as PrismaSession } from '@prisma/client';
import { Session } from '../domain/session.aggregate';
import { SessionId } from '../domain/value-objects/session-id.vo';
import { UserId } from '../domain/value-objects/user-id.vo';
import { EncryptedAccessToken } from '../domain/value-objects/encrypted-access-token.vo';
import { EncryptedRefreshToken } from '../domain/value-objects/encrypted-refresh-token.vo';
import { EncryptionSalt } from '../domain/value-objects/encryption-salt.vo';
import { KeyName } from '../domain/value-objects/key-name.vo';
import { SessionExpiry } from '../domain/value-objects/session-expiry.vo';

export const SessionMapper = {
  toDomain(row: PrismaSession): Session {
    return Session.rehydrate(SessionId.fromString(row.id), {
      userId: UserId.fromString(row.userId),
      encryptedAccessToken: EncryptedAccessToken.fromCiphertext(row.encryptedAccessToken),
      encryptedRefreshToken: EncryptedRefreshToken.fromCiphertext(row.encryptedRefreshToken),
      encryptionSalt: EncryptionSalt.fromString(row.encryptionSalt),
      keyName: KeyName.fromString(row.keyName),
      expiry: SessionExpiry.rehydrate(row.expiresAt),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(session: Session): Omit<PrismaSession, 'createdAt' | 'updatedAt'> & {
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: session.id.value,
      userId: session.userId.value,
      encryptedAccessToken: session.encryptedAccessToken.ciphertext,
      encryptedRefreshToken: session.encryptedRefreshToken.ciphertext,
      encryptionSalt: session.encryptionSalt.value,
      keyName: session.keyName.value,
      expiresAt: session.expiry.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  },
};
