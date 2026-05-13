import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

export enum Role {
  PlatformAdmin = 'PLATFORM_ADMIN',
  TenantAdmin = 'TENANT_ADMIN',
  EngagementManager = 'ENGAGEMENT_MANAGER',
  LeadReviewer = 'LEAD_REVIEWER',
  Reviewer = 'REVIEWER',
}

const VALID_ROLES = new Set<string>(Object.values(Role));

interface UserRoleProps {
  value: Role;
}

export class UserRole extends ValueObject<UserRoleProps> {
  private constructor(value: Role) {
    super({ value });
  }

  static fromString(raw: string): UserRole {
    if (!VALID_ROLES.has(raw)) {
      throw new DomainException(
        'INVALID_USER_ROLE',
        `Unknown role "${raw}". Valid roles: ${Array.from(VALID_ROLES).join(', ')}`,
      );
    }
    return new UserRole(raw as Role);
  }

  static defaultRole(): UserRole {
    return new UserRole(Role.Reviewer);
  }

  get value(): Role {
    return this.props.value;
  }

  isPlatformAdmin(): boolean {
    return this.props.value === Role.PlatformAdmin;
  }

  isLeadReviewer(): boolean {
    return this.props.value === Role.LeadReviewer;
  }

  canManageEngagements(): boolean {
    return (
      this.props.value === Role.PlatformAdmin ||
      this.props.value === Role.TenantAdmin ||
      this.props.value === Role.EngagementManager
    );
  }

  toString(): string {
    return this.props.value;
  }
}
