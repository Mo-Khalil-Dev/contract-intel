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
  auth_login_failed: {
    /** Short reason string — e.g. 'missing_code', 'bad_state', 'network', or a backend error code. */
    reason: string;
  };
  auth_logout_clicked: Record<string, never>;

  // ── Navigation ────────────────────────────────────────────────────
  /**
   * User clicked a top-nav link that isn't 'home' (no-op), 'upload'
   * (has its own event), or 'results' (has its own event). The remaining
   * top-nav destinations are listed below.
   */
  top_nav_link_clicked: {
    destination: 'portfolio' | 'playbook' | 'compare' | 'renewals' | 'settings';
  };

  /** User clicked the "Resume" tile on the dashboard to reopen the last contract. */
  resume_contract_clicked: Record<string, never>;

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

  // ── Upload lifecycle ──────────────────────────────────────────────
  /** User clicked Analyze on the upload screen (file picked, consent checked). */
  upload_submitted: {
    file_size_bytes: number;
  };

  /** Backend issued a documentId and storage URL — upload now in flight. */
  upload_started: {
    document_id: string;
  };

  /** File fully uploaded to storage + backend marked status=complete. */
  upload_completed: {
    document_id: string;
    duration_ms: number;
  };

  /** Upload failed at any stage. */
  upload_failed: {
    reason: 'file_too_large' | 'invalid_type' | 'network' | 'backend' | 'unknown';
  };

  /** User clicked Cancel on the upload screen (before or during upload). */
  upload_cancelled: Record<string, never>;
}

export type AnalyticsEventName = keyof AnalyticsEventPayloads;
