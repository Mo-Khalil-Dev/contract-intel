import { SessionEncryptionService } from './session-encryption.service';
import { AppConfigService } from '../../../config/app-config.service';
import { InfrastructureException } from '../../../shared/exceptions/app-error';

const buildService = (overrides: { encryptionKey?: string; encryptionKeyName?: string } = {}) =>
  new SessionEncryptionService({
    encryptionKey: 'a-valid-encryption-key-of-32-chars-long-x',
    encryptionKeyName: 'primary',
    ...overrides,
  } as AppConfigService);

describe('SessionEncryptionService', () => {
  describe('encrypt + decrypt roundtrip', () => {
    it('decrypts back to the original plaintext', async () => {
      const service = buildService();
      const payload = await service.encrypt('hello-secret-token');

      const plaintext = await service.decrypt(payload);
      expect(plaintext).toBe('hello-secret-token');
    });

    it('produces different ciphertexts for the same plaintext (random salt + IV)', async () => {
      const service = buildService();
      const a = await service.encrypt('hello');
      const b = await service.encrypt('hello');

      expect(a.ciphertext).not.toBe(b.ciphertext);
      expect(a.salt).not.toBe(b.salt);
    });

    it('emits a salt of >= 16 chars (compatible with EncryptionSalt VO)', async () => {
      const service = buildService();
      const payload = await service.encrypt('x');
      expect(payload.salt.length).toBeGreaterThanOrEqual(16);
    });

    it('emits the configured keyName', async () => {
      const service = buildService({ encryptionKeyName: 'rotated-key-2026' });
      const payload = await service.encrypt('x');
      expect(payload.keyName).toBe('rotated-key-2026');
    });

    it('round-trips long plaintext (typical JWT access token size)', async () => {
      const service = buildService();
      const longToken = 'x'.repeat(2000);
      const payload = await service.encrypt(longToken);
      const decrypted = await service.decrypt(payload);
      expect(decrypted).toBe(longToken);
    });

    it('round-trips utf-8 multibyte characters', async () => {
      const service = buildService();
      const payload = await service.encrypt('café 日本語 🔐');
      expect(await service.decrypt(payload)).toBe('café 日本語 🔐');
    });
  });

  describe('encrypt validation', () => {
    it('rejects empty plaintext', async () => {
      const service = buildService();
      await expect(service.encrypt('')).rejects.toThrow(InfrastructureException);
    });
  });

  describe('decrypt validation', () => {
    it('rejects an unknown keyName (defends against rotated keys we no longer hold)', async () => {
      const service = buildService({ encryptionKeyName: 'primary' });
      const payload = await service.encrypt('hello');

      await expect(service.decrypt({ ...payload, keyName: 'unknown-key' })).rejects.toThrow(
        /Unknown encryption key/,
      );
    });

    it('rejects a ciphertext encrypted with a different master key', async () => {
      const a = buildService({ encryptionKey: 'a'.repeat(32) });
      const b = buildService({ encryptionKey: 'b'.repeat(32) });

      const payload = await a.encrypt('hello');
      await expect(b.decrypt(payload)).rejects.toThrow(/Decryption failed/);
    });

    it('rejects a too-short ciphertext (missing IV)', async () => {
      const service = buildService();
      await expect(
        service.decrypt({ ciphertext: 'AAAA', salt: 'x'.repeat(32), keyName: 'primary' }),
      ).rejects.toThrow(/shorter than the IV/);
    });

    it('rejects a malformed payload', async () => {
      const service = buildService();
      await expect(
        service.decrypt({ ciphertext: '' as unknown as string, salt: 's', keyName: 'primary' }),
      ).rejects.toThrow(InfrastructureException);
    });
  });
});
