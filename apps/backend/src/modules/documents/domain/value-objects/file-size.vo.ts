import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface FileSizeProps {
  bytes: number;
}

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const MIN_FILE_SIZE_BYTES = 1;

export class FileSize extends ValueObject<FileSizeProps> {
  private constructor(bytes: number) {
    super({ bytes });
  }

  static fromBytes(bytes: number): FileSize {
    if (!Number.isFinite(bytes) || !Number.isInteger(bytes)) {
      throw new DomainException(
        'INVALID_FILE_SIZE',
        `File size must be a finite integer (got ${bytes})`,
      );
    }
    if (bytes < MIN_FILE_SIZE_BYTES) {
      throw new DomainException(
        'INVALID_FILE_SIZE',
        `File must be at least ${MIN_FILE_SIZE_BYTES} byte (got ${bytes})`,
      );
    }
    if (bytes > MAX_FILE_SIZE_BYTES) {
      throw new DomainException(
        'FILE_TOO_LARGE',
        `File size cannot exceed ${MAX_FILE_SIZE_BYTES} bytes (50 MB); got ${bytes}`,
      );
    }
    return new FileSize(bytes);
  }

  get bytes(): number {
    return this.props.bytes;
  }

  get megabytes(): number {
    return this.props.bytes / (1024 * 1024);
  }
}
