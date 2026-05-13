import { buildPaginationMeta, isPaginatedPayload } from './api-response.interface';

describe('isPaginatedPayload', () => {
  it('returns true for valid paginated payload', () => {
    const payload = {
      data: [{ id: 1 }, { id: 2 }],
      meta: { total: 2, page: 1, pageSize: 20, totalPages: 1 },
    };

    expect(isPaginatedPayload(payload)).toBe(true);
  });

  it('returns true for empty data array', () => {
    const payload = {
      data: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
    };

    expect(isPaginatedPayload(payload)).toBe(true);
  });

  it('returns false for plain object', () => {
    expect(isPaginatedPayload({ id: 1, name: 'Test' })).toBe(false);
  });

  it('returns false for array (not wrapped)', () => {
    expect(isPaginatedPayload([{ id: 1 }, { id: 2 }])).toBe(false);
  });

  it('returns false when data is not an array', () => {
    expect(
      isPaginatedPayload({
        data: { id: 1 },
        meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
      }),
    ).toBe(false);
  });

  it('returns false when meta is missing', () => {
    expect(isPaginatedPayload({ data: [] })).toBe(false);
  });

  it('returns false when meta is incomplete', () => {
    expect(
      isPaginatedPayload({
        data: [],
        meta: { total: 0 },
      }),
    ).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPaginatedPayload(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isPaginatedPayload(undefined)).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isPaginatedPayload('string')).toBe(false);
    expect(isPaginatedPayload(42)).toBe(false);
    expect(isPaginatedPayload(true)).toBe(false);
  });
});

describe('buildPaginationMeta', () => {
  it('computes totalPages correctly for exact division', () => {
    const meta = buildPaginationMeta(100, 1, 20);

    expect(meta).toEqual({
      total: 100,
      page: 1,
      pageSize: 20,
      totalPages: 5,
    });
  });

  it('rounds up totalPages for partial pages', () => {
    const meta = buildPaginationMeta(101, 1, 20);

    expect(meta.totalPages).toBe(6);
  });

  it('returns totalPages of 1 when total is 0', () => {
    const meta = buildPaginationMeta(0, 1, 20);

    expect(meta.totalPages).toBe(1);
  });

  it('returns totalPages of 1 when total is less than pageSize', () => {
    const meta = buildPaginationMeta(5, 1, 20);

    expect(meta.totalPages).toBe(1);
  });

  it('preserves the requested page number', () => {
    const meta = buildPaginationMeta(100, 3, 20);

    expect(meta.page).toBe(3);
  });

  it('throws when pageSize is 0', () => {
    expect(() => buildPaginationMeta(100, 1, 0)).toThrow('pageSize must be greater than 0');
  });

  it('throws when pageSize is negative', () => {
    expect(() => buildPaginationMeta(100, 1, -5)).toThrow('pageSize must be greater than 0');
  });

  it('throws when page is less than 1', () => {
    expect(() => buildPaginationMeta(100, 0, 20)).toThrow('page must be 1 or greater');
  });

  it('throws when total is negative', () => {
    expect(() => buildPaginationMeta(-1, 1, 20)).toThrow('total cannot be negative');
  });
});
