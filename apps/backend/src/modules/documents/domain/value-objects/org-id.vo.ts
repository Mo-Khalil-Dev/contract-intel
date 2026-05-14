import { validate as isUuid } from 'uuid';
import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';
import { UploadedBy } from './uploaded-by.vo';

interface OrgIdProps {
  value: string;
}

/**
 * Identifies the org that owns a Document. Every repository query
 * filters by OrgId so org A cannot see org B's documents.
 *
 * v1 implementation note (2026-05-14): there is no separate Org
 * aggregate yet — OrgId is derived 1:1 from the uploader's UserId.
 * When real multi-tenancy ships (Org + UserOrgMembership aggregates),
 * only this factory changes; the rest of the documents domain keeps
 * its OrgId-shaped foreign key.
 */
export class OrgId extends ValueObject<OrgIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  /** v1: orgId == userId. Replace with a real Org lookup later. */
  static fromUploader(uploadedBy: UploadedBy): OrgId {
    return new OrgId(uploadedBy.userId);
  }

  static fromString(value: string): OrgId {
    if (!isUuid(value)) {
      throw new DomainException('INVALID_ORG_ID', `OrgId must be a UUID (got '${value}')`);
    }
    return new OrgId(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
