import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface KeyNameProps {
  value: string;
}

const KEY_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;

export class KeyName extends ValueObject<KeyNameProps> {
  private constructor(value: string) {
    super({ value });
  }

  static fromString(raw: string): KeyName {
    const value = raw.trim();
    if (value.length === 0) {
      throw new DomainException('INVALID_KEY_NAME', 'Key name cannot be empty');
    }
    if (!KEY_NAME_REGEX.test(value)) {
      throw new DomainException(
        'INVALID_KEY_NAME',
        `Invalid key name "${raw}". Only alphanumeric, dot, underscore, and hyphen are allowed.`,
      );
    }
    return new KeyName(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
