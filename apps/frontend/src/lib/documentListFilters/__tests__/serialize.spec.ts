import { describe, it, expect } from 'vitest';
import { serialize } from '../serialize';
import { DEFAULTS } from '../defaults';

describe('serialize', () => {
  it('produces empty params for all-default filters', () => {
    expect(serialize(DEFAULTS).toString()).toBe('');
  });

  it('omits q when it equals the default', () => {
    expect(serialize({ ...DEFAULTS, q: '' }).has('q')).toBe(false);
  });

  it('includes q when non-default', () => {
    const p = serialize({ ...DEFAULTS, q: 'acme' });
    expect(p.get('q')).toBe('acme');
  });

  it('omits risk when it equals the default', () => {
    expect(serialize({ ...DEFAULTS, risk: 'all' }).has('risk')).toBe(false);
  });

  it('includes risk when non-default', () => {
    expect(serialize({ ...DEFAULTS, risk: 'high' }).get('risk')).toBe('high');
  });

  it('omits sort when it equals the default', () => {
    expect(serialize({ ...DEFAULTS, sort: 'risk' }).has('sort')).toBe(false);
  });

  it('includes sort=date when non-default', () => {
    expect(serialize({ ...DEFAULTS, sort: 'date' }).get('sort')).toBe('date');
  });

  it('omits page=1 (default)', () => {
    expect(serialize({ ...DEFAULTS, page: 1 }).has('page')).toBe(false);
  });

  it('includes page when non-default', () => {
    expect(serialize({ ...DEFAULTS, page: 3 }).get('page')).toBe('3');
  });

  it('omits pageSize=8 (default)', () => {
    expect(serialize({ ...DEFAULTS, pageSize: 8 }).has('pageSize')).toBe(false);
  });

  it('includes pageSize when non-default', () => {
    expect(serialize({ ...DEFAULTS, pageSize: 20 }).get('pageSize')).toBe('20');
  });

  it('only includes non-default keys — clean URL', () => {
    const p = serialize({ ...DEFAULTS, risk: 'high', sort: 'date' });
    expect([...p.keys()].sort()).toEqual(['risk', 'sort']);
  });
});
