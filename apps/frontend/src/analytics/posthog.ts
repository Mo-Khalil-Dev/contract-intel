import posthog from 'posthog-js';

let initialized = false;

/**
 * Initialize PostHog product analytics.
 *
 * Reads VITE_POSTHOG_KEY + VITE_POSTHOG_HOST from env. If the key is missing
 * (e.g. local dev without analytics, CI test runs), this is a no-op — the
 * `posthog` client object still exists but no requests are made.
 *
 * Safe to call multiple times; init only runs once.
 */
export function initPostHog(): void {
  if (initialized) return;

  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

  if (!key) {
    // No key in this environment — leave PostHog disabled.
    return;
  }

  posthog.init(key, {
    api_host: host,
    // Auto-capture pageviews, clicks, form submits — PostHog's standard.
    capture_pageview: true,
    // Honour the user's Do Not Track preference.
    respect_dnt: true,
    // Avoid capturing the *values* the user types into form fields.
    // Field names + form structure still captured, but values are masked.
    mask_all_text: false,
    mask_personal_data_properties: true,
    // We identify users manually after auth resolves — don't auto-merge
    // anonymous pre-login activity into the post-login identity.
    person_profiles: 'identified_only',
  });

  initialized = true;
}

/** Whether PostHog is live in this runtime. False when key is missing. */
export function isPostHogEnabled(): boolean {
  return initialized;
}

export { posthog };
