export const SESSION_ENCRYPTION = Symbol('SESSION_ENCRYPTION');

export interface EncryptedPayload {
  ciphertext: string; // base64 or similar, opaque to the domain
  salt: string; // PBKDF2 salt used to derive the per-record key
  keyName: string; // which rotating master key was used
}

// Port abstracting symmetric encryption of session tokens. Implementations
// use AES-256-CBC with PBKDF2 key derivation. Kept as a port so handlers
// don't reach into crypto details and tests can substitute a fake.
export interface ISessionEncryption {
  encrypt(plaintext: string): Promise<EncryptedPayload>;
  decrypt(payload: EncryptedPayload): Promise<string>;
}
