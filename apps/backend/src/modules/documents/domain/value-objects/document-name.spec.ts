import { DocumentName } from './document-name.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('DocumentName', () => {
  it('accepts a normal filename', () => {
    expect(DocumentName.create('acme-vendor-agreement.pdf').value).toBe(
      'acme-vendor-agreement.pdf',
    );
  });

  it('trims surrounding whitespace', () => {
    expect(DocumentName.create('   contract.pdf   ').value).toBe('contract.pdf');
  });

  it('rejects an empty string', () => {
    expect(() => DocumentName.create('')).toThrow(DomainException);
    expect(() => DocumentName.create('   ')).toThrow(DomainException);
  });

  it('rejects names longer than 255 characters', () => {
    const tooLong = 'a'.repeat(256) + '.pdf';
    expect(() => DocumentName.create(tooLong)).toThrow(DomainException);
  });

  it('accepts names at exactly the 255-char limit', () => {
    const onTheEdge = 'a'.repeat(255);
    expect(() => DocumentName.create(onTheEdge)).not.toThrow();
  });
});
