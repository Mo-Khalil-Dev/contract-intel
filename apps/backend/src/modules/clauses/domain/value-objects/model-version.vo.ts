import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface ModelVersionProps {
  vendor: string;
  name: string;
  version: string;
}

// Format: <vendor>/<name>@<version> — e.g. "anthropic/claude-opus-4-7@2026-05".
// The two model versions (classifier, embedding) rev independently, so we keep
// them as separate string columns rather than overloading one field.
const PATTERN = /^([a-z0-9_-]+)\/([a-z0-9_.-]+)@([a-zA-Z0-9_.\-:+]+)$/;

export class ModelVersion extends ValueObject<ModelVersionProps> {
  private constructor(props: ModelVersionProps) {
    super(props);
  }

  static parse(raw: string): ModelVersion {
    const match = PATTERN.exec(raw);
    if (!match) {
      throw new DomainException(
        'INVALID_MODEL_VERSION',
        `Expected '<vendor>/<name>@<version>' (got '${raw}')`,
      );
    }
    return new ModelVersion({ vendor: match[1], name: match[2], version: match[3] });
  }

  get vendor(): string {
    return this.props.vendor;
  }
  get name(): string {
    return this.props.name;
  }
  get version(): string {
    return this.props.version;
  }
  get value(): string {
    return `${this.props.vendor}/${this.props.name}@${this.props.version}`;
  }

  toString(): string {
    return this.value;
  }
}
