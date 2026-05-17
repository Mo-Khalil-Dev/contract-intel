import { TextPosition } from './text-position.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('TextPosition', () => {
  it('accepts valid offsets and page number', () => {
    const p = TextPosition.create({ startOffset: 10, endOffset: 50, pageNumber: 1 });
    expect(p.startOffset).toBe(10);
    expect(p.endOffset).toBe(50);
    expect(p.pageNumber).toBe(1);
    expect(p.length).toBe(40);
  });

  it('rejects non-integer offsets', () => {
    expect(() =>
      TextPosition.create({ startOffset: 1.5, endOffset: 10, pageNumber: 1 }),
    ).toThrow(DomainException);
  });

  it('rejects negative startOffset', () => {
    expect(() =>
      TextPosition.create({ startOffset: -1, endOffset: 10, pageNumber: 1 }),
    ).toThrow(DomainException);
  });

  it('rejects endOffset == startOffset', () => {
    expect(() =>
      TextPosition.create({ startOffset: 10, endOffset: 10, pageNumber: 1 }),
    ).toThrow(DomainException);
  });

  it('rejects endOffset < startOffset', () => {
    expect(() =>
      TextPosition.create({ startOffset: 10, endOffset: 5, pageNumber: 1 }),
    ).toThrow(DomainException);
  });

  it('rejects pageNumber < 1', () => {
    expect(() =>
      TextPosition.create({ startOffset: 0, endOffset: 10, pageNumber: 0 }),
    ).toThrow(DomainException);
  });

  it('rejects non-integer pageNumber', () => {
    expect(() =>
      TextPosition.create({ startOffset: 0, endOffset: 10, pageNumber: 1.5 }),
    ).toThrow(DomainException);
  });

  it('accepts startOffset = 0', () => {
    expect(() =>
      TextPosition.create({ startOffset: 0, endOffset: 1, pageNumber: 1 }),
    ).not.toThrow();
  });
});
