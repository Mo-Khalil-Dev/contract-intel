/**
 * Phase 10 — risk-band thresholds for the Contracts View filters.
 *
 * Mirrors the frontend's `riskColor()` thresholds so backend filtering
 * matches the badges shown next to each row. Keep these aligned with
 * `apps/frontend/src/config/designTokens.ts` if either side moves.
 */

export type RiskBand = 'all' | 'high' | 'medium' | 'low';

export const HIGH_RISK_MIN = 7;
export const MEDIUM_RISK_MIN = 4;

/**
 * Convert a risk-band filter into an inclusive lower/exclusive upper
 * pair, or null when no filter applies. Used by Prisma `where` clauses.
 */
export function riskBandRange(band: RiskBand): { gte?: number; lt?: number } | null {
  switch (band) {
    case 'high':
      return { gte: HIGH_RISK_MIN };
    case 'medium':
      return { gte: MEDIUM_RISK_MIN, lt: HIGH_RISK_MIN };
    case 'low':
      return { lt: MEDIUM_RISK_MIN };
    case 'all':
    default:
      return null;
  }
}
