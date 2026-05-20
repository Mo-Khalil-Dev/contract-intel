import { ValueObject } from '../../../shared/domain/value-object';
import { DomainException } from '../../../shared/exceptions/app-error';

export enum AuditActionEnum {
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  USER_LOGGED_OUT = 'USER_LOGGED_OUT',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  CLAUSE_REVIEWED = 'CLAUSE_REVIEWED',
  CLAUSE_RESOLVED = 'CLAUSE_RESOLVED',
  CLAUSE_DISMISSED = 'CLAUSE_DISMISSED',
  AUDIT_LOG_EXPORTED = 'AUDIT_LOG_EXPORTED',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_INVALIDATED = 'SESSION_INVALIDATED',
}

const VALID_ACTIONS = new Set<string>(Object.values(AuditActionEnum));

interface AuditActionProps {
  value: AuditActionEnum;
}

export class AuditAction extends ValueObject<AuditActionProps> {
  private constructor(value: AuditActionEnum) {
    super({ value });
  }

  static fromString(raw: string): AuditAction {
    if (!VALID_ACTIONS.has(raw)) {
      throw new DomainException(
        'INVALID_AUDIT_ACTION',
        `Unknown audit action "${raw}". Valid actions: ${Array.from(VALID_ACTIONS).join(', ')}`,
      );
    }
    return new AuditAction(raw as AuditActionEnum);
  }

  static of(action: AuditActionEnum): AuditAction {
    return new AuditAction(action);
  }

  get value(): AuditActionEnum {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
