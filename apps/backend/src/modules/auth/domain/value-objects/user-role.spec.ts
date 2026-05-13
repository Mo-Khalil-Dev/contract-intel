import { UserRole, Role } from './user-role.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('UserRole', () => {
  describe('fromString', () => {
    it('accepts each known role', () => {
      Object.values(Role).forEach((role) => {
        const ur = UserRole.fromString(role);
        expect(ur.value).toBe(role);
      });
    });

    it('rejects an unknown role', () => {
      expect(() => UserRole.fromString('hacker')).toThrow(DomainException);
    });

    it('is case-sensitive (rejects lowercase form)', () => {
      expect(() => UserRole.fromString('reviewer')).toThrow(DomainException);
    });
  });

  describe('defaultRole', () => {
    it('returns Reviewer', () => {
      expect(UserRole.defaultRole().value).toBe(Role.Reviewer);
    });
  });

  describe('role predicates', () => {
    it('isPlatformAdmin is true only for PLATFORM_ADMIN', () => {
      expect(UserRole.fromString(Role.PlatformAdmin).isPlatformAdmin()).toBe(true);
      expect(UserRole.fromString(Role.TenantAdmin).isPlatformAdmin()).toBe(false);
      expect(UserRole.fromString(Role.Reviewer).isPlatformAdmin()).toBe(false);
    });

    it('isLeadReviewer is true only for LEAD_REVIEWER', () => {
      expect(UserRole.fromString(Role.LeadReviewer).isLeadReviewer()).toBe(true);
      expect(UserRole.fromString(Role.Reviewer).isLeadReviewer()).toBe(false);
    });

    it('canManageEngagements is true for admins and engagement managers', () => {
      expect(UserRole.fromString(Role.PlatformAdmin).canManageEngagements()).toBe(true);
      expect(UserRole.fromString(Role.TenantAdmin).canManageEngagements()).toBe(true);
      expect(UserRole.fromString(Role.EngagementManager).canManageEngagements()).toBe(true);
      expect(UserRole.fromString(Role.LeadReviewer).canManageEngagements()).toBe(false);
      expect(UserRole.fromString(Role.Reviewer).canManageEngagements()).toBe(false);
    });
  });
});
