import { validate as isUuid } from 'uuid';
import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface UploadedByProps {
  userId: string;
}

/**
 * Identifies the user who initiated an upload.
 *
 * Lives in the documents domain (not as a direct import of auth's UserId)
 * so the bounded contexts stay decoupled — auth can refactor UserId
 * without breaking documents.
 */
export class UploadedBy extends ValueObject<UploadedByProps> {
  private constructor(userId: string) {
    super({ userId });
  }

  static fromUserId(userId: string): UploadedBy {
    if (!isUuid(userId)) {
      throw new DomainException(
        'INVALID_UPLOADED_BY',
        `UploadedBy expects a UUID userId (got '${userId}')`,
      );
    }
    return new UploadedBy(userId);
  }

  get userId(): string {
    return this.props.userId;
  }

  toString(): string {
    return this.props.userId;
  }
}
