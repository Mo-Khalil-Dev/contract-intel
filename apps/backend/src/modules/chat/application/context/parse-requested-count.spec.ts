import { parseRequestedCount } from './parse-requested-count';

describe('parseRequestedCount', () => {
  it.each([
    ['List Top 2 risky contracts', 2],
    ['top two riskiest', 2],
    ['Show me my 5 riskiest contracts', 5],
    ['first 3 agreements', 3],
    ['three most risky', 3],
    ['what are my 10 highest risk contracts', 10],
  ])('parses %j as %d', (q, expected) => {
    expect(parseRequestedCount(q)).toBe(expected);
  });

  it('returns null when no count is requested', () => {
    expect(parseRequestedCount('Which contracts have unlimited liability?')).toBeNull();
    expect(parseRequestedCount('What are my riskiest contracts?')).toBeNull();
  });

  it('ignores out-of-range numbers (years, large figures)', () => {
    expect(parseRequestedCount('contracts signed in 2026')).toBeNull();
    expect(parseRequestedCount('top 500 contracts')).toBeNull();
  });
});
