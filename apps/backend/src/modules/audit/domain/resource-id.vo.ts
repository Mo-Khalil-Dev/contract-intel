import { ValueObject } from '../../../shared/domain/value-object';
import { DomainException } from '../../../shared/exceptions/app-error';

interface ResourceIdProps {
  value: string;
}

export class ResourceId extends ValueObject<ResourceIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static fromString(value: string): ResourceId {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainException('INVALID_RESOURCE_ID', 'ResourceId must not be empty');
    }
    return new ResourceId(trimmed);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
