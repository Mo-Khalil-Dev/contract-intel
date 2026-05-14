import { OrgId } from './org-id.vo';
import { UploadedBy } from './uploaded-by.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('OrgId', () => {
  it('derives 1:1 from UploadedBy in v1', () => {
    const userId = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';
    const uploader = UploadedBy.fromUserId(userId);
    expect(OrgId.fromUploader(uploader).value).toBe(userId);
  });

  it('rehydrates from a UUID string', () => {
    expect(OrgId.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955').value).toBe(
      '5a0eef1d-4433-454e-a1a5-7ca51bf48955',
    );
  });

  it('rejects a non-UUID string', () => {
    expect(() => OrgId.fromString('not-uuid')).toThrow(DomainException);
  });
});
