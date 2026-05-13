import { EncryptedPayload, ISessionEncryption } from '../domain/ports/session-encryption.port';

// Trivial reversible "encryption" that wraps plaintext in markers so tests
// can assert both the encrypt and decrypt paths without needing real crypto.
export class FakeSessionEncryption implements ISessionEncryption {
  encryptCalls: string[] = [];
  decryptCalls: EncryptedPayload[] = [];

  async encrypt(plaintext: string): Promise<EncryptedPayload> {
    this.encryptCalls.push(plaintext);
    return {
      ciphertext: `enc(${plaintext})`,
      salt: 'fake-salt-of-at-least-16-chars',
      keyName: 'fake-key',
    };
  }

  async decrypt(payload: EncryptedPayload): Promise<string> {
    this.decryptCalls.push(payload);
    const match = /^enc\((.*)\)$/.exec(payload.ciphertext);
    if (!match) {
      throw new Error(`Cannot decrypt malformed ciphertext: ${payload.ciphertext}`);
    }
    return match[1];
  }
}
