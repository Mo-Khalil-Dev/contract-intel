import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface LanguageProps {
  code: string;
}

// v1 ships English-only. Adding a language means appending here and seeding
// the wordlist for textQualityScore — pipeline/detector code stays untouched.
export const SUPPORTED_LANGUAGES: readonly string[] = ['en'];

// Returned when a PDF sample is too short for franc to decide. Always
// accepted by the pipeline; the downstream quality score is the safety net.
export const UNDETERMINED_LANGUAGE = 'und';

export class Language extends ValueObject<LanguageProps> {
  private constructor(code: string) {
    super({ code });
  }

  static fromCode(code: string): Language {
    if (typeof code !== 'string' || code.length === 0) {
      throw new DomainException(
        'INVALID_LANGUAGE_CODE',
        `Language code must be a non-empty string (got '${code}')`,
      );
    }
    const normalised = code.toLowerCase();
    if (normalised !== UNDETERMINED_LANGUAGE && !/^[a-z]{2}$/.test(normalised)) {
      throw new DomainException(
        'INVALID_LANGUAGE_CODE',
        `Language code must be ISO 639-1 (two lowercase letters) or '${UNDETERMINED_LANGUAGE}' (got '${code}')`,
      );
    }
    return new Language(normalised);
  }

  static undetermined(): Language {
    return new Language(UNDETERMINED_LANGUAGE);
  }

  get code(): string {
    return this.props.code;
  }

  isSupported(): boolean {
    return SUPPORTED_LANGUAGES.includes(this.props.code);
  }

  isUndetermined(): boolean {
    return this.props.code === UNDETERMINED_LANGUAGE;
  }
}
