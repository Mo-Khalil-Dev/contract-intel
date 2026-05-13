import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface Auth0SubjectIdProps {
  value: string;
}

// Auth0 subject ids follow the form "<provider>|<id>" — e.g.
// "auth0|abc123", "google-oauth2|9482...", "samlp|connection|user@org".
// The provider part is alphanumeric+hyphen, the id part can contain
// anything non-empty (some enterprise providers embed extra separators).
const SUBJECT_ID_REGEX = /^[a-zA-Z0-9-]+\|.+$/;

export class Auth0SubjectId extends ValueObject<Auth0SubjectIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static fromString(raw: string): Auth0SubjectId {
    const value = raw.trim();
    if (value.length === 0) {
      throw new DomainException('INVALID_AUTH0_SUBJECT_ID', 'Auth0 subject id cannot be empty');
    }
    if (!SUBJECT_ID_REGEX.test(value)) {
      throw new DomainException(
        'INVALID_AUTH0_SUBJECT_ID',
        `Invalid Auth0 subject id "${raw}". Expected "<provider>|<id>" format.`,
      );
    }
    return new Auth0SubjectId(value);
  }

  get value(): string {
    return this.props.value;
  }

  get provider(): string {
    return this.props.value.split('|')[0];
  }

  toString(): string {
    return this.props.value;
  }
}
