/**
 * Helpers for surfacing per-clause risk as document-level summaries on
 * the ResultsPage. Mirrors the thresholds locked in the v2 wireframe's
 * tokens.js: ≥7 high, ≥4 medium, else low — on the 0–10 scale used by
 * the Risk Assessment card.
 *
 * Per design D15 the risk rubric is DRAFT until Phase 9 SME validation.
 * The numeric score is shown, but downstream business rules (auto-flag,
 * escalation) wait for that validation.
 */

import type { ClauseResponse, RiskLevel } from '@/types/clauses';

// ── Thresholds (0..10 scale) ────────────────────────────────────────
const HIGH_THRESHOLD = 7;
const MEDIUM_THRESHOLD = 4;

export type RiskBand = 'low' | 'medium' | 'high';

export function riskBand(score: number): RiskBand {
  if (score >= HIGH_THRESHOLD) return 'high';
  if (score >= MEDIUM_THRESHOLD) return 'medium';
  return 'low';
}

export function riskLabel(score: number): string {
  switch (riskBand(score)) {
    case 'high':
      return 'High Risk';
    case 'medium':
      return 'Medium Risk';
    case 'low':
      return 'Low Risk';
  }
}

export function riskShort(score: number): string {
  switch (riskBand(score)) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
  }
}

/** CSS-variable colour token for a given score band. */
export function riskColorVar(score: number): string {
  switch (riskBand(score)) {
    case 'high':
      return 'var(--color-red)';
    case 'medium':
      return 'var(--color-orange)';
    case 'low':
      return 'var(--color-green)';
  }
}

/** Background-tint CSS variable for risk-coloured cards. */
export function riskBgVar(score: number): string {
  switch (riskBand(score)) {
    case 'high':
      return 'var(--color-red-bg)';
    case 'medium':
      return 'var(--color-orange-bg)';
    case 'low':
      return 'var(--color-green-bg)';
  }
}

// ── Document-level aggregation ──────────────────────────────────────

/**
 * Weighted average of per-clause risk scores, weighted by clause text
 * length so a 5-page indemnification matters more than a one-line
 * boilerplate. Scaled from the backend's 0–100 to the UI's 0–10.
 *
 * Returns null when no clause has a risk score (defensive — the UI
 * shows "—" rather than a misleading zero).
 */
export function documentRiskScore(clauses: ClauseResponse[]): number | null {
  const scored = clauses.filter((c) => c.risk !== null);
  if (scored.length === 0) return null;

  let weighted = 0;
  let totalWeight = 0;
  for (const c of scored) {
    const weight = Math.max(1, c.text.length);
    // c.risk is non-null because of the filter above.
    weighted += (c.risk as NonNullable<ClauseResponse['risk']>).score * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return null;
  return (weighted / totalWeight) / 10; // 0..100 → 0..10
}

// ── Flag bucketing for the Risk Assessment card ─────────────────────

export interface FlagCounts {
  critical: number;
  caution: number;
  info: number;
}

/**
 * Buckets clauses by their riskLevel for the wireframe's 3-number
 * summary on the Overview risk card. Wireframe semantics:
 *   - Critical : critical riskLevel
 *   - Caution  : high OR medium riskLevel
 *   - Info     : low riskLevel
 *
 * Clauses without a risk score don't contribute.
 */
export function flagCounts(clauses: ClauseResponse[]): FlagCounts {
  const out: FlagCounts = { critical: 0, caution: 0, info: 0 };
  for (const c of clauses) {
    if (!c.risk) continue;
    switch (c.risk.level as RiskLevel) {
      case 'critical':
        out.critical += 1;
        break;
      case 'high':
      case 'medium':
        out.caution += 1;
        break;
      case 'low':
        out.info += 1;
        break;
    }
  }
  return out;
}

/**
 * Derive the counterparty name from the parties list. By convention,
 * the FIRST non-"client"/"buyer" party is the counterparty. Falls back
 * to the first party's name. Null when no parties.
 */
export function deriveCounterparty(
  parties: { role: string; name: string }[],
): string | null {
  if (parties.length === 0) return null;
  const counterparty = parties.find(
    (p) => !/client|buyer|customer|our company/i.test(p.role),
  );
  return (counterparty ?? parties[0]).name;
}
