import { describe, it, expect } from 'vitest';
import {
  riskBand,
  riskLabel,
  riskShort,
  documentRiskScore,
  flagCounts,
  deriveCounterparty,
} from './riskHelpers';
import type { ClauseResponse } from '@/types/clauses';

function clause(overrides: Partial<ClauseResponse> = {}): ClauseResponse {
  return {
    id: 'c1',
    extractionRunId: 'r1',
    documentId: 'd1' as ClauseResponse['documentId'],
    parentClauseId: null,
    type: 'other',
    confidence: 0.9,
    pageNumber: 1,
    startOffset: 0,
    endOffset: 10,
    text: 'short',
    hasEmbedding: true,
    risk: { score: 50, level: 'medium', flags: [], explanation: '' },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('riskHelpers', () => {
  describe('bands', () => {
    it.each([
      [0, 'low', 'Low Risk'],
      [3.9, 'low', 'Low Risk'],
      [4, 'medium', 'Medium Risk'],
      [6.9, 'medium', 'Medium Risk'],
      [7, 'high', 'High Risk'],
      [10, 'high', 'High Risk'],
    ])('score %f → band %s (%s)', (score, band, label) => {
      expect(riskBand(score)).toBe(band);
      expect(riskLabel(score)).toBe(label);
    });

    it('riskShort drops the " Risk" suffix', () => {
      expect(riskShort(8)).toBe('High');
      expect(riskShort(5)).toBe('Medium');
      expect(riskShort(2)).toBe('Low');
    });
  });

  describe('documentRiskScore', () => {
    it('returns null for an empty list', () => {
      expect(documentRiskScore([])).toBeNull();
    });

    it('returns null when no clause has risk', () => {
      expect(documentRiskScore([clause({ risk: null })])).toBeNull();
    });

    it('scales 0..100 input to 0..10 output', () => {
      // Single clause with score 70 → 7.0 on the 0..10 scale.
      const c = clause({
        risk: { score: 70, level: 'high', flags: [], explanation: '' },
      });
      expect(documentRiskScore([c])).toBeCloseTo(7, 5);
    });

    it('weights by text length', () => {
      // 10-char low (score 10) + 1000-char critical (score 90).
      // Expected weighted = (10*10 + 1000*90) / 1010 = 89.21 → 8.92 on 0..10
      const small = clause({
        text: 'x'.repeat(10),
        risk: { score: 10, level: 'low', flags: [], explanation: '' },
      });
      const big = clause({
        text: 'y'.repeat(1000),
        risk: { score: 90, level: 'critical', flags: [], explanation: '' },
      });
      const r = documentRiskScore([small, big]);
      expect(r).toBeCloseTo(8.92, 1);
    });

    it('ignores clauses without risk fields', () => {
      const scored = clause({
        text: 'x'.repeat(100),
        risk: { score: 80, level: 'critical', flags: [], explanation: '' },
      });
      const unscored = clause({ risk: null, text: 'y'.repeat(10000) });
      // Unscored clause's huge text should not pull the score down.
      expect(documentRiskScore([scored, unscored])).toBeCloseTo(8, 1);
    });
  });

  describe('flagCounts', () => {
    it('buckets correctly', () => {
      const cs = [
        clause({ risk: { score: 95, level: 'critical', flags: [], explanation: '' } }),
        clause({ risk: { score: 95, level: 'critical', flags: [], explanation: '' } }),
        clause({ risk: { score: 65, level: 'high', flags: [], explanation: '' } }),
        clause({ risk: { score: 35, level: 'medium', flags: [], explanation: '' } }),
        clause({ risk: { score: 10, level: 'low', flags: [], explanation: '' } }),
        clause({ risk: null }),
      ];
      expect(flagCounts(cs)).toEqual({ critical: 2, caution: 2, info: 1 });
    });

    it('returns zeros on an empty list', () => {
      expect(flagCounts([])).toEqual({ critical: 0, caution: 0, info: 0 });
    });
  });

  describe('deriveCounterparty', () => {
    it('returns null for empty parties', () => {
      expect(deriveCounterparty([])).toBeNull();
    });

    it('picks the non-client party', () => {
      expect(
        deriveCounterparty([
          { role: 'Client', name: 'Our Co' },
          { role: 'Provider', name: 'Acme Corp' },
        ]),
      ).toBe('Acme Corp');
    });

    it('falls back to first party when no clear counterparty', () => {
      expect(
        deriveCounterparty([
          { role: 'Party A', name: 'First' },
          { role: 'Party B', name: 'Second' },
        ]),
      ).toBe('First');
    });
  });
});
