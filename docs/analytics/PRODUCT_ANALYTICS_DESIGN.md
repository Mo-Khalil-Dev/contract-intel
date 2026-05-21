# ContractIntel Product Analytics Design

## Overview

This document outlines the product analytics strategy for ContractIntel using PostHog. It serves as a reference for tracking user behavior, measuring feature engagement, and identifying improvement opportunities across the platform.

**Last Updated**: May 2026  
**Status**: Active  
**Owner**: Product Team

---

## Analytics Foundation

### PostHog Configuration

- **Initialization**: `src/analytics/posthog.ts`
- **Event Tracking**: Type-safe via `src/analytics/events.ts`
- **User Identification**: `src/analytics/identity.ts`
- **Environment Variables**:
  - `VITE_POSTHOG_KEY`: PostHog project API key
  - `VITE_POSTHOG_HOST`: PostHog instance URL (defaults to EU: `https://eu.i.posthog.com`)

### Tracking Principles

1. **Type Safety**: All custom events are defined in `AnalyticsEventPayloads` interface
2. **No PII**: User IDs only; no email, names, or free-text in event payloads
3. **Graceful Degradation**: If `VITE_POSTHOG_KEY` is missing (local dev, CI), tracking is a no-op
4. **User Privacy**: 
   - `respect_dnt`: Honor browser Do Not Track preference
   - `mask_personal_data_properties`: Mask form field values
   - `person_profiles: 'identified_only'`: Only track identified users post-login

---

## Event Registry

All custom events are defined with their payload shape below. Use the `track()` function (never `posthog.capture()` directly) to ensure compile-time type safety.

### Authentication Lifecycle

#### auth_login_succeeded
Fired when OAuth callback completes successfully and user is authenticated.

- **File**: `src/pages/LoginCallbackPage.tsx`
- **Payload**: Empty (`Record<string, never>`)
- **Properties**: User ID, email (set via `identify()`)
- **When**: Auth0 token exchange succeeds

#### auth_login_failed
Fired when OAuth callback fails or returns an error.

- **File**: `src/pages/LoginCallbackPage.tsx`
- **Payload**:
  - `reason`: short string — e.g., `'missing_code'`, `'bad_state'`, `'network'`, backend error code
- **When**: OAuth fails, missing parameters, token exchange error

#### auth_logout_clicked
Fired when user initiates logout.

- **File**: `src/components/features/LogoutButton/useLogoutButton.ts`
- **Payload**: Empty
- **Side Effect**: Calls `posthog.reset()` to clear user identity
- **When**: User clicks logout button

---

### Dashboard Interactions

#### dashboard_viewed
Fired once per dashboard mount after KPI data has loaded.

- **File**: `src/pages/HomePageV2/HomePageV2Container.tsx`
- **Payload**:
  - `critical_flag_count`: number of open critical flags
  - `urgent_renewal_count`: number of renewals < 60 days
  - `active_contract_count`: total active contracts
- **When**: Dashboard data load completes
- **Frequency**: Once per session load; fires even if values are 0
- **Use Case**: Measure dashboard engagement, track baseline portfolio health

#### dashboard_kpi_hovered
Fired when cursor dwells on a KPI card for ≥500ms (avoiding casual hover).

- **File**: `src/pages/HomePageV2/HomePageV2.tsx`
- **Payload**:
  - `kpi`: one of `'active_contracts'`, `'avg_risk_score'`, `'critical_flags'`, `'renewals_60d'`
- **Implementation**: `useHoverTracker()` hook
- **Use Case**: Understand which metrics users care about most

#### dashboard_kpi_clicked
Fired when user clicks a KPI card (future — not all are interactive yet).

- **File**: `src/pages/HomePageV2/HomePageV2.tsx`
- **Payload**:
  - `kpi`: same as above
- **Status**: Not yet implemented (requires clickable KPI cards)
- **Use Case**: Track which metrics drive deeper exploration

#### dashboard_upload_cta_clicked
Fired when user clicks any "Upload contract" call-to-action.

- **Files**:
  - `src/pages/HomePageV2/HomePageV2Container.tsx` (top nav)
  - `src/pages/HomePageV2/components/DarkCallToActionCard.tsx` ("Where to start" card)
- **Payload**:
  - `source`: one of `'greeting'`, `'where_to_start'`, `'top_nav'`
- **Use Case**: Measure upload CTA effectiveness across placement
- **Funnels**: Part of "Browse → Upload → Analyze" flow

#### dashboard_upload_cta_hovered
Fired when cursor dwells on the "Where to start" upload CTA card for ≥500ms.

- **File**: `src/pages/HomePageV2/components/DarkCallToActionCard.tsx`
- **Payload**:
  - `source`: `'where_to_start'`
- **Implementation**: `useHoverTracker()` hook
- **Use Case**: Measure CTA card interest before click

#### resume_contract_clicked
Fired when user clicks "Pick up where you left off" card.

- **File**: `src/pages/HomePageV2/HomePageV2Container.tsx`
- **Payload**: Empty
- **Use Case**: Track engagement with recently viewed contracts

#### recent_contract_clicked
Fired when user clicks a row in the "Recent contracts" table.

- **File**: `src/pages/HomePageV2/components/RecentContractsCard.tsx`
- **Payload**:
  - `position`: 0-indexed row number (0-3 typically)
  - `risk_bucket`: one of `'low'`, `'medium'`, `'high'`
- **Use Case**: Measure which contracts attract attention, by risk level

#### urgent_renewal_clicked
Fired when user clicks a row in the "Upcoming renewals" list.

- **File**: `src/pages/HomePageV2/components/UpcomingRenewalsCard.tsx`
- **Payload**:
  - `position`: 0-indexed row number
  - `urgency`: one of `'critical'` (≤ 0d), `'high'` (< 30d), `'medium'` (< 60d)
  - `days_remaining`: exact number of days
- **Use Case**: Understand renewal urgency and user responsiveness

---

### Navigation

#### top_nav_link_clicked
Fired when user clicks a top navigation link (excluding Home, Upload, Results).

- **File**: `src/pages/HomePageV2/HomePageV2Container.tsx`
- **Payload**:
  - `destination`: one of `'portfolio'`, `'playbook'`, `'compare'`, `'renewals'`, `'settings'`
- **Use Case**: Measure navigation patterns and screen adoption

---

### Upload Lifecycle

#### upload_submitted
Fired when user clicks "Analyze" on the upload screen after selecting files and agreeing to consent.

- **File**: `src/pages/UploadPage/UploadPageContainer.tsx`
- **Payload**:
  - `file_size_bytes`: total size of all selected files
- **Timing**: Before upload to storage begins
- **Use Case**: Funnel step; track file size distribution

#### upload_started
Fired when backend issues a `documentId` and storage URL — upload is now in flight.

- **File**: `src/hooks/useUpload.ts`
- **Payload**:
  - `document_id`: unique document identifier from backend
- **Timing**: After backend allocation, before file transfer starts
- **Use Case**: Track which uploads reach processing; used in funnels

#### upload_completed
Fired when file fully uploaded to storage and backend marks status as "complete".

- **File**: `src/hooks/useUpload.ts`
- **Payload**:
  - `document_id`: unique document identifier
  - `duration_ms`: total time from user submission to completion
- **Timing**: After processing completes
- **Use Case**: Measure upload performance, success rates, time-to-completion

#### upload_failed
Fired when upload fails at any stage (file validation, storage, backend).

- **File**: `src/hooks/useUpload.ts`, `src/pages/UploadPage/UploadPageContainer.tsx`
- **Payload**:
  - `reason`: one of `'file_too_large'`, `'invalid_type'`, `'network'`, `'backend'`, `'unknown'`
- **Use Case**: Funnel drop-off; debug common upload issues

#### upload_cancelled
Fired when user clicks "Cancel" on the upload screen before or during upload.

- **Files**:
  - `src/hooks/useUpload.ts`
  - `src/pages/UploadPage/UploadPageContainer.tsx`
- **Payload**: Empty
- **Use Case**: Measure upload abandonment

---

## Insights & Dashboards

### Ready-to-Use PostHog Views

Pre-built insights and dashboards are available in PostHog for:

1. **Analytics Basics Dashboard** — Overview of all events, user counts, daily active users
2. **Auth: Login Success vs Failures** — Funnel and conversion rates
3. **Dashboard Engagement Actions** — Top actions on home screen (CTAs, nav, KPI hovers)
4. **Funnel: Login → Upload Contract** — End-to-end conversion tracking
5. **Error Boundary Triggers** — React error rates and patterns
6. **Logout Rate** — Session exit tracking

Access these via PostHog dashboard (URLs provided in wizard report).

### Custom Analyses to Create

#### 1. Upload Funnel
```
uploaded_submitted → upload_started → upload_completed
```
**Metrics**: Conversion rate at each step, drop-off reasons

#### 2. Dashboard → Contracts Portal
```
dashboard_viewed → top_nav_link_clicked (destination: 'portfolio')
```
**Metrics**: Portal adoption, feature discovery

#### 3. KPI Interest Heatmap
```
dashboard_kpi_hovered (by kpi)
dashboard_kpi_clicked (by kpi)
```
**Metrics**: Which KPIs attract attention; click rates by KPI

#### 4. Urgency Response
```
urgent_renewal_clicked (by urgency level)
```
**Metrics**: User responsiveness to critical vs. high renewals

#### 5. Upload CTA Effectiveness
```
dashboard_upload_cta_clicked (by source)
```
**Metrics**: Which CTA placement drives most clicks

---

## Implementation Checklist

### Phase 1: Core Events (✓ Complete)
- [x] Auth login/logout events
- [x] Dashboard upload CTA tracking
- [x] Resume contract clicked
- [x] Top navigation tracking
- [x] Upload lifecycle (submitted → completed/failed/cancelled)
- [x] KPI hover tracking

### Phase 2: Enhanced Dashboard Events (In Progress)
- [ ] `dashboard_viewed` — fired on dashboard load
- [ ] `dashboard_upload_cta_hovered` — hover tracking on "Where to start" card
- [ ] `recent_contract_clicked` — row clicks in recent contracts table
- [ ] `urgent_renewal_clicked` — row clicks in renewals table

### Phase 3: Feature Screens (Pending)
- [ ] Portfolio screen events (filter, sort, search interactions)
- [ ] Results/detail screen events (flag inspection, note taking)
- [ ] Playbook screen events (compliance comparison, edit interactions)
- [ ] Renewals screen events (row selection, status updates)
- [ ] Settings screen events (team, billing, audit log interactions)

### Phase 4: Advanced Analytics (Planned)
- [ ] Session heatmaps
- [ ] Feature adoption tracking
- [ ] Cohort analysis by contract type/risk level
- [ ] Error recovery patterns
- [ ] Performance metric correlation with user behavior

---

## Event Payload Guidelines

### General Rules

1. **Use short, descriptive names** — `critical_flag_count` not `number_of_flags_that_are_critical`
2. **Enums for options** — Use string union types (`'high' | 'medium' | 'low'`) not booleans
3. **No PII** — User names, emails, contract names, clause text → never include
4. **Always include IDs** — `document_id`, `contract_id` → safe and useful
5. **Counts, durations, scores** — Include numeric facts (file size, time, risk score)

### Risk Scoring
```typescript
risk_bucket: 'low' | 'medium' | 'high'
// Typically: low = 0-40, medium = 40-70, high = 70-100
```

### Durations
```typescript
duration_ms: number
// Always in milliseconds for consistency
```

### Positioning
```typescript
position: number
// 0-indexed; use for "which item in a list did the user interact with"
```

---

## User Identification

### Timing
User identity is captured via `identify()` in the login callback:
```typescript
// From src/analytics/identity.ts
posthog.identify(user.id, {
  email: user.email,
  name: user.name,  // optional
});
```

### When to Call `reset()`
Call `posthog.reset()` on logout to assign a fresh anonymous `distinct_id`. This prevents the next visitor on the same browser from inheriting the previous user's identity.

### User Properties
- `email`: Searchable in PostHog dashboard
- `name`: Optional display name
- All other user properties set via dashboard

---

## Testing Analytics Locally

### Enable Tracking in Development
1. Set `VITE_POSTHOG_KEY` in `.env.local` (even a dummy key is fine)
2. Open browser DevTools → Console
3. `posthog.debug()` to see event logs
4. Interact with the app; watch events appear in the console

### Verify Event Payloads
```javascript
// In browser console
posthog.on('eventCaptured', (event) => {
  console.log('Event captured:', event.event, event.properties);
});
```

### Disable Tracking for Tests
Tests automatically disable tracking when `VITE_POSTHOG_KEY` is missing. No action needed.

---

## Privacy & Compliance

### GDPR Compliance
- PostHog respects `Do Not Track` (DNT) browser setting when enabled
- User data deleted on logout via `posthog.reset()`
- No third-party sharing of event data

### Data Retention
PostHog (EU) retains data for 7 years unless configured otherwise in your plan.

### Consent
- No consent banner needed for analytics (not marketing pixels)
- Covered under Terms of Service
- Users on DNT are opt-out automatically

---

## Adding New Events

### Step 1: Define the Event
Add entry to `AnalyticsEventPayloads` in `src/analytics/events.ts`:
```typescript
export interface AnalyticsEventPayloads {
  // ... existing events ...
  my_new_event: {
    context_id: string;
    action_type: 'approve' | 'reject';
  };
}
```

### Step 2: Use the Event
Import and call `track()`:
```typescript
import { track } from '@/analytics';

track('my_new_event', {
  context_id: '123',
  action_type: 'approve',
});
```

TypeScript will enforce payload shape automatically.

### Step 3: Document It
Add entry to "Event Registry" section above with:
- File where it's called
- Payload shape
- When/why it fires
- Use case

---

## Resources

- **PostHog Docs**: https://posthog.com/docs
- **Event Tracking Best Practices**: https://posthog.com/docs/product-analytics/event-autocapture
- **Analytics Glossary**: https://posthog.com/docs/product-analytics/glossary
- **Type-Safe Tracking**: See `src/analytics/track.ts` for typed `track()` function

---

## Questions & Support

For questions about analytics implementation or instrumentation:
1. Check this document for event definitions
2. Review existing event implementations in the codebase
3. Refer to PostHog dashboard for real-time data
4. Contact product team for analysis requests
