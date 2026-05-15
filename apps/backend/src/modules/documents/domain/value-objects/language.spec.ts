import { Language, UNDETERMINED_LANGUAGE } from './language.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('Language', () => {
  it('accepts an ISO 639-1 code', () => {
    expect(Language.fromCode('en').code).toBe('en');
    expect(Language.fromCode('fr').code).toBe('fr');
  });

  it('normalises to lowercase', () => {
    expect(Language.fromCode('EN').code).toBe('en');
  });

  it('accepts the undetermined sentinel', () => {
    expect(Language.fromCode(UNDETERMINED_LANGUAGE).code).toBe('und');
    expect(Language.undetermined().isUndetermined()).toBe(true);
  });

  it('rejects empty string', () => {
    expect(() => Language.fromCode('')).toThrow(DomainException);
  });

  it('rejects 3-letter codes (we use 639-1, not 639-3)', () => {
    expect(() => Language.fromCode('eng')).toThrow(DomainException);
  });

  it('rejects digits / punctuation', () => {
    expect(() => Language.fromCode('e1')).toThrow(DomainException);
    expect(() => Language.fromCode('e-')).toThrow(DomainException);
  });

  describe('isSupported', () => {
    it('returns true for en (v1 allowlist)', () => {
      expect(Language.fromCode('en').isSupported()).toBe(true);
    });

    it('returns false for other languages', () => {
      expect(Language.fromCode('fr').isSupported()).toBe(false);
      expect(Language.fromCode('de').isSupported()).toBe(false);
    });

    it('returns false for undetermined', () => {
      expect(Language.undetermined().isSupported()).toBe(false);
    });
  });
});
