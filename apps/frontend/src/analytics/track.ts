import { isPostHogEnabled, posthog } from './posthog';
import type { AnalyticsEventName, AnalyticsEventPayloads } from './events';

/**
 * Fire a typed analytics event.
 *
 * Use this — not `posthog.capture` directly — for every custom event,
 * so the event name and payload shape are checked at compile time.
 *
 * No-ops if PostHog isn't initialised (e.g. test runs, dev without a key).
 *
 * @example
 *   track('dashboard_upload_cta_clicked', { source: 'greeting' });
 */
export function track<E extends AnalyticsEventName>(
  event: E,
  ...args: AnalyticsEventPayloads[E] extends Record<string, never>
    ? []
    : [payload: AnalyticsEventPayloads[E]]
): void {
  if (!isPostHogEnabled()) return;
  posthog.capture(event, args[0]);
}
