import { describe, it, expect } from 'vitest';
import { parse } from '../parse';
import { DEFAULTS } from '../defaults';

function params(qs: string): URLSearchParams {
  return new URLSearchParams(qs);
}

describe('parse', () => {
  describe('defaults', () => {
    it('returns all defaults for empty params', () => {
      expect(parse(params(''))).toEqual(DEFAULTS);
    });

    it('returns default risk=all when risk is absent', () => {
      expect(parse(params('sort=date')).risk).toBe('all');
    });

    it('returns default page=1 when page is absent', () => {
      expect(parse(params('')).page).toBe(1);
    });

    it('returns default pageSize=8 when pageSize is absent', () => {
      expect(parse(params('')).pageSize).toBe(8);
    });
  });

  describe('valid values', () => {
    it('parses q correctly', () => {
      expect(parse(params('q=acme')).q).toBe('acme');
    });

    it.each(['high', 'medium', 'low', 'all'] as const)('parses risk=%s', (risk) => {
      expect(parse(params(`risk=${risk}`)).risk).toBe(risk);
    });

    it.each(['vendor', 'license', 'partnership', 'customer', 'lease', 'nda', 'other', 'all'] as const)(
      'parses type=%s',
      (type) => {
        expect(parse(params(`type=${type}`)).type).toBe(type);
      },
    );

    it.each(['risk', 'date', 'name'] as const)('parses sort=%s', (sort) => {
      expect(parse(params(`sort=${sort}`)).sort).toBe(sort);
    });

    it('parses page as integer', () => {
      expect(parse(params('page=5')).page).toBe(5);
    });

    it('parses pageSize as integer', () => {
      expect(parse(params('pageSize=25')).pageSize).toBe(25);
    });
  });

  describe('coercion of invalid values', () => {
    it('coerces unknown risk to default', () => {
      expect(parse(params('risk=extreme')).risk).toBe(DEFAULTS.risk);
    });

    it('coerces unknown type to default', () => {
      expect(parse(params('type=deed')).type).toBe(DEFAULTS.type);
    });

    it('coerces unknown sort to default', () => {
      expect(parse(params('sort=random')).sort).toBe(DEFAULTS.sort);
    });

    it('coerces page=0 to default', () => {
      expect(parse(params('page=0')).page).toBe(DEFAULTS.page);
    });

    it('coerces negative page to default', () => {
      expect(parse(params('page=-1')).page).toBe(DEFAULTS.page);
    });

    it('coerces non-numeric page to default', () => {
      expect(parse(params('page=abc')).page).toBe(DEFAULTS.page);
    });

    it('coerces pageSize=0 to default', () => {
      expect(parse(params('pageSize=0')).pageSize).toBe(DEFAULTS.pageSize);
    });

    it('coerces pageSize=51 to default', () => {
      expect(parse(params('pageSize=51')).pageSize).toBe(DEFAULTS.pageSize);
    });
  });

  describe('round-trip with serialize', () => {
    it('parse(serialize(filters)) === filters for non-default values', async () => {
      const { serialize } = await import('../serialize');
      const filters = { q: 'acme', risk: 'high' as const, type: 'vendor' as const, sort: 'date' as const, page: 3, pageSize: 20 };
      expect(parse(serialize(filters))).toEqual(filters);
    });

    it('parse(serialize(defaults)) === defaults', async () => {
      const { serialize } = await import('../serialize');
      expect(parse(serialize(DEFAULTS))).toEqual(DEFAULTS);
    });
  });
});
