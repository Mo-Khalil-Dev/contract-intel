import { UploadedBy } from './uploaded-by.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('UploadedBy', () => {
  it('accepts a valid UUID', () => {
    const u = UploadedBy.fromUserId('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
    expect(u.userId).toBe('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
  });

  it('rejects a non-UUID string', () => {
    expect(() => UploadedBy.fromUserId('not-a-uuid')).toThrow(DomainException);
  });

  it('rejects empty string', () => {
    expect(() => UploadedBy.fromUserId('')).toThrow(DomainException);
  });
});
