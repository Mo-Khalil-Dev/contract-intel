import { isPostHogEnabled, posthog } from './posthog';
import type { User } from '@/types/auth';

/**
 * Bind PostHog's anonymous distinct_id to a real, post-login user.
 *
 * After this, every subsequent event from this browser is attributed to
 * the user's stable id. Email (and name, if present) are set as person
 * properties so the user is searchable in the PostHog dashboard.
 *
 * Idempotent — calling repeatedly with the same user is fine; PostHog
 * just re-asserts the binding. No-op when PostHog isn't initialised.
 */
export function identify(user: User): void {
  if (!isPostHogEnabled()) return;
  posthog.identify(user.id, {
    email: user.email,
    ...(user.name ? { name: user.name } : {}),
  });
}

/**
 * Clear the user binding and assign a fresh anonymous distinct_id.
 *
 * Call on logout — otherwise the next visitor on the same browser
 * inherits the previous user's identity (and you'll merge a stranger's
 * actions into someone else's profile).
 */
export function reset(): void {
  if (!isPostHogEnabled()) return;
  posthog.reset();
}
