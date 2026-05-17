import { ModelVersion } from './model-version.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('ModelVersion', () => {
  it('parses vendor/name@version', () => {
    const v = ModelVersion.parse('anthropic/claude-opus-4-7@2026-05');
    expect(v.vendor).toBe('anthropic');
    expect(v.name).toBe('claude-opus-4-7');
    expect(v.version).toBe('2026-05');
    expect(v.value).toBe('anthropic/claude-opus-4-7@2026-05');
  });

  it('parses voyage/voyage-law-2@2026-05', () => {
    const v = ModelVersion.parse('voyage/voyage-law-2@2026-05');
    expect(v.name).toBe('voyage-law-2');
  });

  it('rejects missing @version', () => {
    expect(() => ModelVersion.parse('anthropic/claude-opus-4-7')).toThrow(
      DomainException,
    );
  });

  it('rejects missing vendor', () => {
    expect(() => ModelVersion.parse('claude-opus-4-7@2026-05')).toThrow(
      DomainException,
    );
  });

  it('rejects empty string', () => {
    expect(() => ModelVersion.parse('')).toThrow(DomainException);
  });
});
