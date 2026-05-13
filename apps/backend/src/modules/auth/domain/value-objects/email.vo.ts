import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface EmailProps {
  value: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject<EmailProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(raw: string): Email {
    const value = raw.trim().toLowerCase();
    if (value.length === 0) {
      throw new DomainException('INVALID_EMAIL', 'Email cannot be empty');
    }
    if (!EMAIL_REGEX.test(value)) {
      throw new DomainException('INVALID_EMAIL', `Invalid email format: ${raw}`);
    }
    return new Email(value);
  }

  get value(): string {
    return this.props.value;
  }

  get domain(): string {
    return this.props.value.split('@')[1] ?? '';
  }

  toString(): string {
    return this.props.value;
  }
}
