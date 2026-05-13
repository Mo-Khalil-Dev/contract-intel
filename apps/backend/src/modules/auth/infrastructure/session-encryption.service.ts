import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'crypto';
import { AppConfigService } from '../../../config/app-config.service';
import { EncryptedPayload, ISessionEncryption } from '../domain/ports/session-encryption.port';
import { InfrastructureException } from '../../../shared/exceptions/app-error';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256-bit key
const IV_LENGTH = 16; // AES block size
const SALT_LENGTH = 16; // 16 bytes; emitted as 32-char hex (>= 16 chars required by EncryptionSalt VO)
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_DIGEST = 'sha256';

// Concrete adapter implementing ISessionEncryption. Uses AES-256-CBC with a
// per-record PBKDF2-derived key:
//
//   1. Each encryption generates a fresh 16-byte salt and 16-byte IV.
//   2. The per-record key is derived from (masterKey, salt) via PBKDF2.
//   3. Output ciphertext stores `${IV}${actualCiphertext}` base64url-encoded.
//   4. Master key is identified by ENCRYPTION_KEY_NAME so we can rotate
//      keys later (decrypt picks the master key by keyName).
//
// For phase 1 we only have one master key. Adding a key map for rotation
// is a future enhancement — the keyName field is already wired through.
/* eslint-disable @typescript-eslint/require-await --
 * The ISessionEncryption interface returns Promises so adapters that DO
 * make async calls (e.g. KMS-backed) fit naturally. This local adapter
 * uses Node's sync crypto functions because pbkdf2/aes are CPU-bound and
 * have no async benefit at this scale. The async signature is preserved
 * for interface conformance.
 */
@Injectable()
export class SessionEncryptionService implements ISessionEncryption {
  constructor(private readonly config: AppConfigService) {}

  async encrypt(plaintext: string): Promise<EncryptedPayload> {
    if (typeof plaintext !== 'string' || plaintext.length === 0) {
      throw new InfrastructureException(
        'INVALID_PLAINTEXT',
        'Cannot encrypt empty or non-string plaintext',
      );
    }

    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const keyName = this.config.encryptionKeyName;
    const key = this.deriveKey(salt);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

    return {
      ciphertext: Buffer.concat([iv, encrypted]).toString('base64url'),
      salt: salt.toString('hex'),
      keyName,
    };
  }

  async decrypt(payload: EncryptedPayload): Promise<string> {
    if (!payload || typeof payload.ciphertext !== 'string' || typeof payload.salt !== 'string') {
      throw new InfrastructureException('INVALID_CIPHERTEXT', 'Malformed encrypted payload');
    }

    if (payload.keyName !== this.config.encryptionKeyName) {
      // When key rotation is added, look up the historical key by keyName.
      throw new InfrastructureException(
        'UNKNOWN_ENCRYPTION_KEY',
        `Unknown encryption key "${payload.keyName}"`,
      );
    }

    const salt = Buffer.from(payload.salt, 'hex');
    const key = this.deriveKey(salt);

    let combined: Buffer;
    try {
      combined = Buffer.from(payload.ciphertext, 'base64url');
    } catch {
      throw new InfrastructureException('INVALID_CIPHERTEXT', 'Ciphertext is not valid base64url');
    }

    if (combined.length <= IV_LENGTH) {
      throw new InfrastructureException(
        'INVALID_CIPHERTEXT',
        'Ciphertext is shorter than the IV header',
      );
    }

    const iv = combined.subarray(0, IV_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH);

    try {
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (error) {
      throw new InfrastructureException(
        'DECRYPTION_FAILED',
        `Decryption failed: ${(error as Error).message}`,
      );
    }
  }

  private deriveKey(salt: Buffer): Buffer {
    return pbkdf2Sync(
      this.config.encryptionKey,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      PBKDF2_DIGEST,
    );
  }
}
