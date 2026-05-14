/**
 * Central registry of every custom analytics event in the app.
 *
 * Every event must be declared here with its payload shape. The `track()`
 * function in `track.ts` is typed against this map — if you call
 * `track('foo', { ... })` with a payload that doesn't match, TypeScript
 * will complain. Adding a new event means adding one line below.
 *
 * Conventions:
 * - Event names are `snake_case`, past tense for things that already
 *   happened (`auth_login_succeeded`), present continuous for in-flight
 *   states (`upload_in_progress`).
 * - Payload keys are `snake_case`.
 * - NO PII in the top-level payload keys or values. `userId` is fine
 *   (PostHog already has it from identify); email, names, free-text are
 *   not. Send IDs, enums, counts, durations — nothing the user typed.
 */

export interface AnalyticsEventPayloads {
  // ── Auth lifecycle ────────────────────────────────────────────────
  auth_login_succeeded: Record<string, never>;
  auth_logout_clicked: Record<string, never>;

  // ── Dashboard interactions ────────────────────────────────────────
  /** Fired once per dashboard mount when data has loaded. */
  dashboard_viewed: {
    critical_flag_count: number;
    urgent_renewal_count: number;
    active_contract_count: number;
  };

  /** Cursor lingered on a KPI tile long enough to count as interest. */
  dashboard_kpi_hovered: {
    kpi: 'active_contracts' | 'avg_risk_score' | 'critical_flags' | 'renewals_60d';
  };

  /** User clicked a KPI tile (future — not all tiles are clickable yet). */
  dashboard_kpi_clicked: {
    kpi: 'active_contracts' | 'avg_risk_score' | 'critical_flags' | 'renewals_60d';
  };

  /** User clicked the "Upload contract" CTA. */
  dashboard_upload_cta_clicked: {
    /** Where on the page the user clicked from. */
    source: 'greeting' | 'where_to_start' | 'top_nav';
  };

  /** Cursor lingered on the dark "Where to start" CTA card. */
  dashboard_upload_cta_hovered: {
    source: 'where_to_start';
  };

  /** User clicked a row in the recent contracts table. */
  recent_contract_clicked: {
    /** Position of the row in the list (0-indexed). */
    position: number;
    risk_bucket: 'low' | 'medium' | 'high';
  };

  /** User clicked a row in the upcoming renewals list. */
  urgent_renewal_clicked: {
    position: number;
    urgency: 'critical' | 'high' | 'medium';
    days_remaining: number;
  };
}

export type AnalyticsEventName = keyof AnalyticsEventPayloads;
