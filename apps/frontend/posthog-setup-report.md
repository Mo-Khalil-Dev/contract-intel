# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the ContractIntel frontend. The project already had PostHog initialized (`src/analytics/posthog.ts`) and environment variables configured (`apps/frontend/.env.local`). The integration adds user identification, action event tracking across the dashboard, auth flow tracking, and error capture. `posthog-js` was also added to `apps/frontend/package.json` to properly track the dependency.

## Changes made

| File | Change |
|------|--------|
| `apps/frontend/package.json` | Added `posthog-js` as a dependency |
| `apps/frontend/.env.local` | Confirmed `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` are set correctly |

## Events instrumented

| Event | Description | File |
|-------|-------------|------|
| `login_completed` | Fired when the Auth0 OAuth callback succeeds and session is established | `src/pages/LoginCallbackPage.tsx` |
| `login_failed` | Fired when the OAuth callback returns an error or has missing parameters | `src/pages/LoginCallbackPage.tsx` |
| `logout_clicked` | Fired when the user initiates a logout (also calls `posthog.reset()`) | `src/components/features/LogoutButton/useLogoutButton.ts` |
| `upload_contract_clicked` | Fired when any upload contract CTA is clicked on the dashboard | `src/pages/HomePageV2/HomePageV2Container.tsx` |
| `view_contracts_clicked` | Fired when the user navigates to the full contracts portfolio list | `src/pages/HomePageV2/HomePageV2Container.tsx` |
| `view_renewals_clicked` | Fired when the user navigates to the renewals view | `src/pages/HomePageV2/HomePageV2Container.tsx` |
| `resume_contract_clicked` | Fired when "Pick up where you left off" is clicked | `src/pages/HomePageV2/HomePageV2Container.tsx` |
| `nav_item_clicked` | Fired for top nav links (playbook, compare, settings) with `destination` property | `src/pages/HomePageV2/HomePageV2Container.tsx` |
| `error_boundary_triggered` | Fired with `posthog.captureException()` when the React error boundary catches an unhandled render error | `src/components/core/ErrorBoundary/ErrorBoundary.tsx` |

## User identification

`posthog.identify(user.id, { email, name })` is called via the `onSuccess` callback of the `useAuth` react-query hook whenever the current user is fetched from the API. This ensures that all post-login activity is associated with the correct user identity.

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/681392)
- [Auth: Login success vs failures](/insights/cyrVubUI)
- [Dashboard engagement actions](/insights/b6goUdDW)
- [Funnel: Login → Upload contract](/insights/bNj4c93y)
- [Error boundary triggers](/insights/96fKfgA8)
- [Logout rate](/insights/i6PA7zxH)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
