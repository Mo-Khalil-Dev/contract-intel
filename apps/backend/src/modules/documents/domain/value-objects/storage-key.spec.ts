import { StorageKey } from './storage-key.vo';
import { DocumentId } from './document-id.vo';
import { DocumentType } from './document-type.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('StorageKey', () => {
  it('mints a key from a documentId + type', () => {
    const id = DocumentId.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
    const type = DocumentType.fromValue('PDF');
    expect(StorageKey.forDocument(id, type).value).toBe(
      '5a0eef1d-4433-454e-a1a5-7ca51bf48955.pdf',
    );
  });

  it('rehydrates a well-formed key from a string', () => {
    expect(() =>
      StorageKey.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955.pdf'),
    ).not.toThrow();
  });

  it('rejects an empty key', () => {
    expect(() => StorageKey.fromString('')).toThrow(DomainException);
    expect(() => StorageKey.fromString('   ')).toThrow(DomainException);
  });

  it('rejects keys missing an extension', () => {
    expect(() => StorageKey.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955')).toThrow(
      DomainException,
    );
  });

  it('rejects path-like keys (no slashes)', () => {
    expect(() => StorageKey.fromString('org/123/file.pdf')).toThrow(DomainException);
  });
});
