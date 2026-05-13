import { describe, it, expect } from 'vitest';
import {
  colors,
  riskBg,
  riskColor,
  riskLabel,
  riskLevel,
  riskShort,
  sevBg,
  sevColor,
} from './designTokens';

describe('riskLevel (0-100 scale, default)', () => {
  it('returns low below 40', () => {
    expect(riskLevel(0)).toBe('low');
    expect(riskLevel(20)).toBe('low');
    expect(riskLevel(39)).toBe('low');
  });

  it('returns medium between 40 (inclusive) and 70 (exclusive)', () => {
    expect(riskLevel(40)).toBe('medium');
    expect(riskLevel(55)).toBe('medium');
    expect(riskLevel(69)).toBe('medium');
  });

  it('returns high at or above 70', () => {
    expect(riskLevel(70)).toBe('high');
    expect(riskLevel(85)).toBe('high');
    expect(riskLevel(100)).toBe('high');
  });
});

describe('riskLevel (custom scale via max parameter)', () => {
  it('treats 0-10 scale correctly', () => {
    expect(riskLevel(2, 10)).toBe('low');
    expect(riskLevel(4, 10)).toBe('medium');
    expect(riskLevel(7, 10)).toBe('high');
  });

  it('treats 0-5 scale correctly', () => {
    expect(riskLevel(1, 5)).toBe('low');
    expect(riskLevel(2, 5)).toBe('medium');
    expect(riskLevel(4, 5)).toBe('high');
  });

  it('matches wireframe behaviour at 0-10 scale (>=7 high, >=4 medium)', () => {
    expect(riskLevel(7, 10)).toBe('high');
    expect(riskLevel(6.9, 10)).toBe('medium');
    expect(riskLevel(4, 10)).toBe('medium');
    expect(riskLevel(3.9, 10)).toBe('low');
  });
});

describe('riskColor', () => {
  it('returns red for high risk', () => {
    expect(riskColor(80)).toBe(colors.red);
    expect(riskColor(8, 10)).toBe(colors.red);
  });

  it('returns orange for medium risk', () => {
    expect(riskColor(50)).toBe(colors.orange);
    expect(riskColor(5, 10)).toBe(colors.orange);
  });

  it('returns green for low risk', () => {
    expect(riskColor(20)).toBe(colors.green);
    expect(riskColor(2, 10)).toBe(colors.green);
  });
});

describe('riskBg', () => {
  it('returns redBg for high risk', () => {
    expect(riskBg(80)).toBe(colors.redBg);
  });

  it('returns orangeBg for medium risk', () => {
    expect(riskBg(50)).toBe(colors.orangeBg);
  });

  it('returns greenBg for low risk', () => {
    expect(riskBg(20)).toBe(colors.greenBg);
  });
});

describe('riskLabel', () => {
  it('returns descriptive labels', () => {
    expect(riskLabel(80)).toBe('High Risk');
    expect(riskLabel(50)).toBe('Medium Risk');
    expect(riskLabel(20)).toBe('Low Risk');
  });
});

describe('riskShort', () => {
  it('returns short labels', () => {
    expect(riskShort(80)).toBe('High');
    expect(riskShort(50)).toBe('Medium');
    expect(riskShort(20)).toBe('Low');
  });
});

describe('threshold boundary behaviour', () => {
  it('treats exactly 40 as medium (>= threshold)', () => {
    expect(riskLevel(40)).toBe('medium');
  });

  it('treats exactly 70 as high (>= threshold)', () => {
    expect(riskLevel(70)).toBe('high');
  });

  it('treats just below 40 as low', () => {
    expect(riskLevel(39.999)).toBe('low');
  });

  it('treats just below 70 as medium', () => {
    expect(riskLevel(69.999)).toBe('medium');
  });
});

describe('sevColor', () => {
  it('maps semantic severities to colour palette', () => {
    expect(sevColor('red')).toBe(colors.red);
    expect(sevColor('orange')).toBe(colors.orange);
    expect(sevColor('green')).toBe(colors.green);
  });
});

describe('sevBg', () => {
  it('maps semantic severities to background palette', () => {
    expect(sevBg('red')).toBe(colors.redBg);
    expect(sevBg('orange')).toBe(colors.orangeBg);
    expect(sevBg('green')).toBe(colors.greenBg);
  });
});

describe('colour palette completeness', () => {
  it('exposes all expected colours', () => {
    expect(colors.bg).toBeDefined();
    expect(colors.surface).toBeDefined();
    expect(colors.ink).toBeDefined();
    expect(colors.border).toBeDefined();
    expect(colors.blue).toBeDefined();
    expect(colors.green).toBeDefined();
    expect(colors.orange).toBeDefined();
    expect(colors.red).toBeDefined();
    expect(colors.nav).toBeDefined();
  });

  it('uses uppercase 6-digit hex for every colour', () => {
    Object.values(colors).forEach((value) => {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    });
  });
});
