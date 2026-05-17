import { ContractMetadata } from './contract-metadata.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('ContractMetadata', () => {
  it('empty() yields nulls/[] for every field', () => {
    const m = ContractMetadata.empty();
    expect(m.contractType).toBeNull();
    expect(m.parties).toEqual([]);
    expect(m.effectiveDate).toBeNull();
    expect(m.paymentAmount).toBeNull();
  });

  it('create() round-trips a populated metadata', () => {
    const m = ContractMetadata.create({
      contractType: 'Vendor',
      parties: [
        { role: 'Provider', name: 'Acme Corporation' },
        { role: 'Client', name: 'Our Company Ltd' },
      ],
      effectiveDate: '2024-01-15',
      terminationDate: '2025-01-14',
      noticePeriod: '60 days',
      autoRenewal: 'Yes, 1-year terms',
      paymentAmount: '£50,000',
      currency: 'GBP',
      paymentSchedule: 'Quarterly',
      priceEscalation: '2% annual',
      paymentTerms: 'Net 30 days',
    });
    expect(m.contractType).toBe('Vendor');
    expect(m.parties).toHaveLength(2);
    expect(m.parties[0]).toEqual({ role: 'Provider', name: 'Acme Corporation' });
    expect(m.paymentAmount).toBe('£50,000');
  });

  it('rejects a party with empty role or name', () => {
    expect(() =>
      ContractMetadata.create({ parties: [{ role: '', name: 'X' }] }),
    ).toThrow(DomainException);
    expect(() =>
      ContractMetadata.create({ parties: [{ role: 'X', name: '' }] }),
    ).toThrow(DomainException);
  });

  it('rejects more than 10 parties', () => {
    const parties = Array.from({ length: 11 }, (_, i) => ({
      role: `r${i}`,
      name: `n${i}`,
    }));
    expect(() => ContractMetadata.create({ parties })).toThrow(DomainException);
  });

  it('rejects oversize fields (>500 chars)', () => {
    expect(() =>
      ContractMetadata.create({ paymentTerms: 'x'.repeat(501) }),
    ).toThrow(DomainException);
  });

  it('rejects non-string optional fields', () => {
    expect(() =>
      ContractMetadata.create({ effectiveDate: 123 as unknown as string }),
    ).toThrow(DomainException);
  });

  it('toJSON returns a plain copy', () => {
    const m = ContractMetadata.create({
      contractType: 'NDA',
      parties: [{ role: 'Discloser', name: 'A' }],
    });
    const j = m.toJSON();
    expect(j.contractType).toBe('NDA');
    expect(j.parties[0].name).toBe('A');
  });
});
