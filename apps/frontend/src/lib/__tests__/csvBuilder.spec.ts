import { describe, it, expect } from 'vitest';
import { escapeCsvCell, formatIsoDate, buildContractsCsv } from '../csvBuilder';
import type { DocumentListItem } from '@/types/contracts';

// ── escapeCsvCell ────────────────────────────────────────────────

describe('escapeCsvCell', () => {
  it('passes through a plain string unchanged', () => {
    expect(escapeCsvCell('Acme Corp')).toBe('Acme Corp');
  });

  it('wraps a string containing a comma in double-quotes', () => {
    expect(escapeCsvCell('Smith, Jones Ltd')).toBe('"Smith, Jones Ltd"');
  });

  it('wraps a string containing a double-quote and escapes it', () => {
    expect(escapeCsvCell('Say "hello"')).toBe('"Say ""hello"""');
  });

  it('wraps a string containing a newline', () => {
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('handles an empty string', () => {
    expect(escapeCsvCell('')).toBe('');
  });
});

// ── formatIsoDate ────────────────────────────────────────────────

describe('formatIsoDate', () => {
  it('extracts YYYY-MM-DD from a full ISO timestamp', () => {
    expect(formatIsoDate('2025-12-31T23:59:59.000Z')).toBe('2025-12-31');
  });

  it('returns the date unchanged when passed just YYYY-MM-DD', () => {
    expect(formatIsoDate('2024-06-15')).toBe('2024-06-15');
  });

  it('returns empty string for null', () => {
    expect(formatIsoDate(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatIsoDate(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatIsoDate('')).toBe('');
  });
});

// ── buildContractsCsv ────────────────────────────────────────────

const BASE_ITEM: DocumentListItem = {
  id: 'abc-123',
  orgId: 'org-1',
  name: 'Vendor Agreement',
  type: 'vendor',
  counterparty: 'Acme Corp',
  riskScore: 7.5,
  flagsRed: 2,
  flagsOrange: 3,
  flagsBlue: 1,
  terminationDate: '2026-12-31T00:00:00.000Z',
  uploadedAt: '2025-01-15T10:30:00.000Z',
  status: 'complete',
  hasUnlimitedLiability: false,
  updatedAt: '2025-01-15T10:31:00.000Z',
};

describe('buildContractsCsv', () => {
  it('produces a header row as the first line', () => {
    const csv = buildContractsCsv([]);
    const [header] = csv.split('\r\n');
    expect(header).toBe('Name,Type,Counterparty,Risk Score,Red Flags,Orange Flags,Blue Flags,Expiry,Uploaded,Status');
  });

  it('produces one data row per item', () => {
    const csv = buildContractsCsv([BASE_ITEM, BASE_ITEM]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it('formats a complete item correctly', () => {
    const csv = buildContractsCsv([BASE_ITEM]);
    const [, dataRow] = csv.split('\r\n');
    expect(dataRow).toBe('Vendor Agreement,vendor,Acme Corp,7.5,2,3,1,2026-12-31,2025-01-15,complete');
  });

  it('quotes a name containing a comma', () => {
    const item = { ...BASE_ITEM, name: 'Smith, Jones Agreement' };
    const csv = buildContractsCsv([item]);
    const [, dataRow] = csv.split('\r\n');
    expect(dataRow).toMatch(/^"Smith, Jones Agreement"/);
  });

  it('writes empty string for null riskScore', () => {
    const item = { ...BASE_ITEM, riskScore: null };
    const csv = buildContractsCsv([item]);
    const [, dataRow] = csv.split('\r\n');
    const cols = dataRow.split(',');
    expect(cols[3]).toBe(''); // Risk Score column
  });

  it('writes empty string for null terminationDate', () => {
    const item = { ...BASE_ITEM, terminationDate: null };
    const csv = buildContractsCsv([item]);
    const [, dataRow] = csv.split('\r\n');
    const cols = dataRow.split(',');
    expect(cols[7]).toBe(''); // Expiry column
  });

  it('writes empty string for null counterparty', () => {
    const item = { ...BASE_ITEM, counterparty: null as unknown as string };
    const csv = buildContractsCsv([item]);
    const [, dataRow] = csv.split('\r\n');
    const cols = dataRow.split(',');
    expect(cols[2]).toBe(''); // Counterparty column
  });

  it('uses CRLF line endings per RFC 4180', () => {
    const csv = buildContractsCsv([BASE_ITEM]);
    expect(csv).toContain('\r\n');
    expect(csv.split('\r\n')).toHaveLength(2); // header + 1 row
  });

  it('uses dot as decimal separator for risk score', () => {
    const item = { ...BASE_ITEM, riskScore: 6.5 };
    const csv = buildContractsCsv([item]);
    expect(csv).toContain('6.5');
  });
});
