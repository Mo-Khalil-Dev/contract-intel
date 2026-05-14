/**
 * HomePageV2 tokens — mirrors the wireframe's tokens.js exactly.
 *
 * These values intentionally duplicate src/index.css CSS variables so this
 * folder is self-contained (per the experiment's brief: build a fully
 * custom version that doesn't rely on shared infra).
 *
 * Hex values are sourced from wirframes/version_02/design_handoff_ci_redesign/tokens.js.
 */

export const T = {
  // Backgrounds
  bg: '#FAFAF9',
  bgAlt: '#F4F3F1',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F8F7',
  ink: '#0F172A',
  inkMid: '#334155',
  inkSoft: '#64748B',
  inkMute: '#94A3B8',
  border: '#E2E8F0',
  borderMid: '#CBD5E1',

  // Accent
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueLight: '#DBEAFE',
  blueMid: '#93C5FD',

  // Semantic
  green: '#10B981',
  greenDark: '#059669',
  greenBg: '#ECFDF5',
  greenBorder: '#6EE7B7',

  orange: '#F59E0B',
  orangeDark: '#D97706',
  orangeBg: '#FFFBEB',
  orangeBorder: '#FCD34D',

  red: '#EF4444',
  redDark: '#DC2626',
  redBg: '#FEF2F2',
  redBorder: '#FCA5A5',

  // Nav
  nav: '#0F172A',
  navBorder: '#1E293B',
} as const;

export type Severity = 'red' | 'orange' | 'green';

/**
 * The real backend serves risk scores on a 0–100 scale
 * (see referenceDataService.ts). Thresholds chosen so the wireframe's
 * "≥7 / ≥4" intuition still holds — i.e. ≥70 high, ≥40 medium, else low.
 */
const HIGH_RISK = 70;
const MED_RISK = 40;

export const riskColor = (s: number): string =>
  s >= HIGH_RISK ? T.red : s >= MED_RISK ? T.orange : T.green;

export const riskBg = (s: number): string =>
  s >= HIGH_RISK ? T.redBg : s >= MED_RISK ? T.orangeBg : T.greenBg;

export const riskLabel = (s: number): string =>
  s >= HIGH_RISK ? 'High Risk' : s >= MED_RISK ? 'Medium Risk' : 'Low Risk';

export const sevColor = (sev: Severity): string =>
  sev === 'red' ? T.red : sev === 'orange' ? T.orange : T.green;

export const sevBg = (sev: Severity): string =>
  sev === 'red' ? T.redBg : sev === 'orange' ? T.orangeBg : T.greenBg;

/** Map the backend's UrgentRenewal.urgency enum to a colour band. */
export const urgencyColor = (urgency: 'critical' | 'high' | 'medium'): string =>
  urgency === 'critical' ? T.red : urgency === 'high' ? T.orange : T.green;
