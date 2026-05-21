# Requirements Document

## Introduction

The Contract Analysis Platform is an AI-powered, compliance-grade system for ingesting, analyzing, and managing complex legal documents at scale. It serves in-house counsel, M&A teams, and law firms conducting due diligence. The platform extracts and classifies contractual clauses, scores risk, orchestrates multi-user review workflows, and maintains immutable audit trails to satisfy regulatory requirements. This document defines the functional and non-functional requirements derived from the approved technical design.

---

## Glossary

- **Platform**: The Contract Analysis Platform system as a whole.
- **Tenant**: An organization (law firm, company) with isolated data and configuration within the Platform.
- **Engagement**: A scoped due diligence project containing one or more documents and assigned reviewers.
- **Document**: A legal contract file (PDF, Word, or scanned image) uploaded to the Platform.
- **Clause**: A discrete, semantically meaningful segment of a Document, classified by type (e.g., indemnification, governing law).
- **Ingestion_Service**: The component responsible for accepting, validating, and storing uploaded Documents.
- **OCR_Engine**: The component that converts scanned or non-searchable Documents into machine-readable text.
- **NLP_Classifier**: The AI component that segments Document text into Clauses and assigns a ClauseType to each.
- **Risk_Engine**: The component that evaluates Clauses against risk rules and produces risk scores and flags.
- **Workflow_Service**: The component that manages Engagement lifecycle, reviewer assignments, and review progress.
- **Collaboration_Service**: The component that manages annotations, comments, and clause-level review status.
- **Audit_Service**: The component that records all significant Platform actions to an immutable, append-only log.
- **Reporting_Service**: The component that generates structured reports and exports from Engagement data.
- **Auth_Service**: The component responsible for authentication, authorization, and session management.
- **Reviewer**: A user assigned to review Clauses within an Engagement.
- **Lead_Reviewer**: A Reviewer with authority to approve, escalate, or close Clause reviews.
- **Engagement_Manager**: A user with authority to create Engagements and assign Reviewers.
- **Tenant_Admin**: A user with full administrative access within a Tenant.
- **ClauseType**: A classification label for a Clause (e.g., indemnification, limitation_of_liability, governing_law).
- **RiskLevel**: A categorical risk assessment: low, medium, high, or critical.
- **AuditEvent**: A structured, immutable record of a significant Platform action.
- **RetentionPolicy**: Rules governing how long a Document must be retained before it may be deleted.

---

## Requirements

### Requirement 0: User Authentication and Login

**User Story:** As a legal professional (in-house counsel, M&A specialist, or law firm member), I want to authenticate securely with the Platform using my organization's identity provider, so that I can access contract analysis tools with confidence that only authorized team members can view sensitive legal documents.

#### Acceptance Criteria

1. WHEN a user navigates to the Platform without an active session, THE Auth_Service SHALL redirect them to the Auth0 Universal Login interface, preserving the originally requested URL for post-login redirect.
2. WHEN a user provides valid credentials via Auth0, THE Auth_Service SHALL exchange the authorization code for tokens, encrypt and store them server-side in a `Session` record, and issue a single signed session cookie with HttpOnly, Secure, and SameSite=Strict flags.
3. WHEN a user successfully authenticates for the first time, THE Auth_Service SHALL create a `User` record in the platform database with their Auth0 subject ID, email, display name, and role assignment.
4. WHEN a returning user authenticates, THE Auth_Service SHALL retrieve their existing `User` record and update their `lastLoginAt` timestamp.
5. WHEN a user authenticates, THE Platform SHALL log a `user_login` AuditEvent with the user ID, timestamp, and IP address.
6. WHEN a request arrives with a valid session cookie, THE Auth_Service SHALL decrypt the session's access token and attach the user's identity and roles to the request context.
7. WHEN a request arrives and the access token has expired, THE Auth_Service SHALL silently use the stored refresh token to obtain new tokens, update the `Session` record in place, and continue processing the request without requiring re-authentication.
8. WHEN a refresh token expires or is revoked, THE Auth_Service SHALL delete the `Session` record, clear the session cookie, and redirect the user to login.
9. WHEN a user clicks "logout", THE Auth_Service SHALL delete the `Session` record, revoke the refresh token at Auth0, clear the session cookie, and redirect to a logout confirmation page.
10. Auth0 SHALL enforce brute-force protection via its built-in Attack Protection feature; THE Auth_Service SHALL surface the error message returned by Auth0 to the user.
11. WHEN a user logs in, THE Platform SHALL load their assigned role and access permissions into the session context.
12. WHEN a user is successfully authenticated, they SHALL be redirected to the Platform dashboard.

---

### Requirement 1: Document Ingestion

**User Story:** As an Engagement_Manager, I want to upload legal documents in multiple formats, so that the Platform can analyze them as part of a due diligence Engagement.

#### Acceptance Criteria

1. WHEN a user uploads a file, THE Ingestion_Service SHALL accept files in PDF, DOCX, TIFF, and PNG formats.
2. WHEN a file is uploaded, THE Ingestion_Service SHALL reject files exceeding 500 MB and return a descriptive error message.
3. WHEN a file is uploaded, THE Ingestion_Service SHALL compute and store a SHA-256 checksum of the original file.
4. WHEN a file is uploaded, THE Ingestion_Service SHALL encrypt the file using AES-256 before writing it to object storage.
5. WHEN a file is successfully stored, THE Ingestion_Service SHALL return a `documentId` and an initial status of `queued_for_ocr` or `classifying` within 5 seconds.
6. WHEN a file is uploaded, THE Ingestion_Service SHALL publish a `document.uploaded` event to the message queue to trigger downstream processing.
7. IF a file fails virus scanning, THEN THE Ingestion_Service SHALL reject the upload and return a `422 Unprocessable Entity` response.
8. THE Ingestion_Service SHALL enforce per-Tenant storage quotas and reject uploads that would exceed the configured quota.

---

### Requirement 2: OCR Processing

**User Story:** As a Reviewer, I want scanned documents and image-based PDFs to be converted to searchable text, so that the Platform can extract and classify their clauses.

#### Acceptance Criteria

1. WHEN a Document with a non-searchable format is queued, THE OCR_Engine SHALL extract machine-readable text from every page.
2. WHEN OCR processing completes, THE OCR_Engine SHALL store the extracted text alongside the original Document in object storage.
3. WHEN OCR processing completes, THE OCR_Engine SHALL record a confidence score between 0.0 and 1.0 for the extraction.
4. WHEN OCR processing fails after 3 retry attempts, THE OCR_Engine SHALL set the Document status to `failed` and notify the uploading user.
5. THE OCR_Engine SHALL preserve page structure and page numbers in the extracted text output.
6. THE OCR_Engine SHALL support documents in English and SHALL be configurable to support additional languages.

---

### Requirement 3: Clause Extraction and Classification

**User Story:** As a Reviewer, I want the Platform to automatically identify and classify contractual clauses, so that I can focus my review on the most relevant and risky provisions.

#### Acceptance Criteria

1. WHEN a Document's text is available, THE NLP_Classifier SHALL segment the text into discrete Clauses.
2. WHEN a Clause is extracted, THE NLP_Classifier SHALL assign a ClauseType from the supported taxonomy (indemnification, limitation_of_liability, termination, governing_law, dispute_resolution, intellectual_property, confidentiality, payment_terms, representations_warranties, force_majeure, assignment, change_of_control, non_compete, data_protection, other).
3. WHEN a Clause is classified, THE NLP_Classifier SHALL record a confidence score between 0.0 and 1.0 for the classification.
4. WHEN a Clause is extracted, THE NLP_Classifier SHALL record the page number, start offset, and end offset within the Document text.
5. THE NLP_Classifier SHALL support nested sub-clauses by linking child Clauses to a parent Clause via `parentClauseId`.
6. WHEN classification completes, THE NLP_Classifier SHALL record the model version used to produce the classification.
7. THE NLP_Classifier SHALL produce an embedding vector for each Clause to support semantic search.

---

### Requirement 4: Risk Scoring

**User Story:** As a Lead_Reviewer, I want each clause to be automatically scored for risk, so that I can prioritize my review on the highest-risk provisions.

#### Acceptance Criteria

1. WHEN Clause extraction is complete for a Document, THE Risk_Engine SHALL score every extracted Clause.
2. WHEN scoring a Clause, THE Risk_Engine SHALL produce a numeric risk score between 0 and 100 and a categorical RiskLevel (low, medium, high, critical).
3. WHEN a Clause is scored, THE Risk_Engine SHALL produce one or more RiskFlags identifying the specific risk categories triggered.
4. WHEN a Clause is scored, THE Risk_Engine SHALL provide a human-readable explanation and a suggested action for each RiskFlag.
5. WHEN all Clauses in a Document are scored, THE Risk_Engine SHALL compute a document-level `overallRiskScore` that is greater than or equal to the highest individual Clause risk score.
6. THE Risk_Engine SHALL support configurable risk rule sets per EngagementType (ma_due_diligence, vendor_contract, employment, real_estate, financing).
7. WHEN a Clause receives a RiskLevel of `high` or `critical`, THE Risk_Engine SHALL emit a `high_risk_detected` event to trigger user notification.
8. IF the AI scoring model is unavailable, THEN THE Risk_Engine SHALL fall back to rule-based scoring and mark affected Documents with a `degraded_analysis` flag.

---

### Requirement 5: Due Diligence Workflow Management

**User Story:** As an Engagement_Manager, I want to organize documents into engagements and assign reviewers, so that my team can conduct structured due diligence at scale.

#### Acceptance Criteria

1. WHEN an Engagement_Manager creates an Engagement, THE Workflow_Service SHALL create the Engagement with a status of `draft` and associate it with the creating user's Tenant.
2. WHEN an Engagement is activated, THE Workflow_Service SHALL require at least one Lead_Reviewer to be assigned before the status transitions to `active`.
3. WHEN a Reviewer is assigned to an Engagement, THE Workflow_Service SHALL restrict that Reviewer's document access to the Documents and ClauseTypes within their assigned ReviewScope.
4. WHEN a Reviewer updates a Clause review status, THE Workflow_Service SHALL record the reviewing user's ID and the timestamp of the review.
5. THE Workflow_Service SHALL support multi-stage review gates where Clauses must be reviewed by a Reviewer before a Lead_Reviewer can approve them.
6. WHEN all Clauses in an Engagement have been reviewed, THE Workflow_Service SHALL update the Engagement status to `under_review` and notify the Lead_Reviewer.
7. THE Workflow_Service SHALL expose an `EngagementProgress` metric reflecting the fraction of Clauses reviewed, between 0.0 and 1.0.
8. WHEN an Engagement deadline passes with incomplete reviews, THE Workflow_Service SHALL notify the Engagement_Manager and all assigned Lead_Reviewers.

---

### Requirement 6: Collaboration and Annotation

**User Story:** As a Reviewer, I want to annotate clauses and discuss them with my team, so that we can collaboratively assess risk and reach consensus.

#### Acceptance Criteria

1. WHEN a Reviewer adds an annotation to a Clause, THE Collaboration_Service SHALL persist the annotation with the author's user ID, timestamp, and annotation type (comment, suggestion, issue, approval).
2. WHEN an annotation is added, THE Collaboration_Service SHALL log an `annotation_added` AuditEvent.
3. WHEN a Reviewer resolves an annotation, THE Collaboration_Service SHALL record the resolving user's ID and timestamp.
4. THE Collaboration_Service SHALL maintain a complete, immutable history of all Clause-level status changes and annotations.
5. WHEN two users simultaneously submit conflicting updates to the same Clause, THE Collaboration_Service SHALL detect the conflict using optimistic concurrency control and return a `409 Conflict` response to the second writer.
6. THE Collaboration_Service SHALL support @mention notifications that trigger alerts to the mentioned user via the Notification Service.
7. WHEN a Reviewer escalates a Clause, THE Collaboration_Service SHALL notify the Lead_Reviewer assigned to that Engagement.

---

### Requirement 7: Audit Trail and Compliance

**User Story:** As a platform administrator, I want every significant action in the Platform to be recorded in a tamper-evident, append-only audit log, so that we can satisfy regulatory, evidentiary, and compliance requirements.

#### Acceptance Criteria

1. THE Audit_Service SHALL record an AuditEvent for every action in the AuditAction taxonomy: `user_login`, `user_logout`, `document_uploaded`, `document_deleted`, `document_accessed`, `clauses_extracted`, `risk_scored`, `annotation_added`, `clause_reviewed`, `engagement_created`, `engagement_closed`, `report_exported`, `user_permission_changed`.
2. WHEN an AuditEvent is written, THE Audit_Service SHALL compute and store a SHA-256 checksum of the event payload (`id|timestamp|actorId|action|resourceId`) for tamper detection.
3. THE Audit_Service SHALL use an append-only PostgreSQL table where the application database role has INSERT and SELECT permissions only — no UPDATE or DELETE is permitted.
4. WHEN an AuditEvent is written, THE Audit_Service SHALL store the actor's user ID, IP address, user agent, action, resource type, resource ID, timestamp, and optional JSON metadata.
5. THE Audit_Service SHALL be invoked via domain event handlers — audit logging is a side effect of domain events, not called directly from command handlers.
6. THE Audit_Service SHALL support querying audit events by actorId, action, resourceId, and date range with pagination.
7. THE Audit_Service SHALL support export of the audit log in JSON and CSV formats.
8. THE Audit_Service SHALL store audit events indefinitely (no retention policy in phase 1).
9. IF an unauthorized access attempt is detected, THEN THE Audit_Service SHALL log the attempt with the actor's user ID, IP address, and the resource that was requested.

---

### Requirement 8: Access Control and Authentication

**User Story:** As a Tenant_Admin, I want fine-grained access control and strong authentication, so that only authorized users can access sensitive legal documents and engagement data.

#### Acceptance Criteria

1. THE Auth_Service SHALL use Auth0 Universal Login (hosted forms) with the Authorization Code Flow — no custom login UI is built in the platform.
2. THE Auth_Service SHALL store Auth0 tokens server-side encrypted using AES-256-CBC with PBKDF2 key derivation; tokens are never sent to the browser.
3. THE Auth_Service SHALL issue a single signed session cookie (HttpOnly, Secure, SameSite=Strict) containing a session reference ID and safe user claims (userId, email, roles).
4. WHEN a user attempts to access a resource they are not authorized to view, THE Auth_Service SHALL return a `403 Forbidden` response without disclosing details about the resource.
5. THE Auth_Service SHALL implement role-based access control evaluating user role and resource-level assignment for every request via the `SessionAuthGuard`.
6. WHEN a user's role or permissions are changed, THE Auth_Service SHALL log a `user_permission_changed` AuditEvent.
7. THE Auth_Service SHALL invalidate the `Session` record and clear the session cookie when a user's account is suspended.
8. THE Auth_Service SHALL silently refresh expired access tokens using the stored refresh token without requiring user re-authentication.

---

### Requirement 9: Reporting and Export

**User Story:** As an Engagement_Manager, I want to generate structured due diligence reports and export clause data, so that I can deliver findings to clients and stakeholders.

#### Acceptance Criteria

1. WHEN an Engagement_Manager requests a due diligence report, THE Reporting_Service SHALL generate a report aggregating risk scores, clause classifications, annotations, and review status for all Documents in the Engagement.
2. THE Reporting_Service SHALL support report export in PDF, DOCX, XLSX, and JSON formats.
3. WHEN a report export is requested for an Engagement with more than 1,000 Documents, THE Reporting_Service SHALL process the export asynchronously and notify the requesting user when the export is ready.
4. WHEN a report is exported, THE Reporting_Service SHALL log a `report_exported` AuditEvent including the requesting user, timestamp, and export format.
5. THE Reporting_Service SHALL enforce export access controls such that only users with explicit export permissions may download report files.
6. THE Reporting_Service SHALL support configurable report templates including firm-branded and standard due diligence formats.
7. WHEN a risk summary report is requested for a Document, THE Reporting_Service SHALL include all RiskFlags, risk scores, and suggested actions for every Clause in the Document.

---

### Requirement 10: Multi-Tenant Data Isolation

**User Story:** As a Tenant_Admin, I want my organization's data to be completely isolated from other tenants, so that confidential legal documents are never accessible to unauthorized parties.

#### Acceptance Criteria

1. THE Platform SHALL enforce row-level security at the database layer such that all queries are automatically scoped to the authenticated user's Tenant.
2. THE Platform SHALL validate the `tenantId` on every read and write operation against the authenticated user's Tenant membership.
3. WHEN a Document, Clause, or Engagement is created, THE Platform SHALL associate it with the creating user's `tenantId` and reject any attempt to assign it to a different Tenant.
4. THE Platform SHALL encrypt Documents using per-Tenant encryption keys managed by a dedicated key management service.
5. WHEN a Tenant is deprovisioned, THE Platform SHALL purge or archive all Tenant data in accordance with the configured RetentionPolicy.

---

### Requirement 11: Performance and Scalability

**User Story:** As a Tenant_Admin, I want the Platform to handle large-scale due diligence engagements without degradation, so that my team can work efficiently under time pressure.

#### Acceptance Criteria

1. THE Platform SHALL support concurrent processing of at least 500 Documents simultaneously by horizontally scaling OCR and NLP workers.
2. WHEN a clause search query is submitted, THE Platform SHALL return results within 200 milliseconds at the 99th percentile under normal load.
3. WHEN a semantic search query is submitted, THE Platform SHALL return results within 500 milliseconds at the 99th percentile under normal load.
4. WHEN a synchronous API request is received, THE Platform SHALL respond within 300 milliseconds at the 99th percentile, excluding long-running operations that are handled asynchronously.
5. THE Platform SHALL enforce per-Tenant API rate limits at the API Gateway layer to ensure fair resource allocation.

---

### Requirement 12: Notification and Alerting

**User Story:** As a Reviewer, I want to receive timely notifications about document processing completion, risk flags, and workflow events, so that I can act on them without manually polling the system.

#### Acceptance Criteria

1. WHEN a Document completes processing and is ready for review, THE Platform SHALL notify the assigned Reviewers via in-app notification and email.
2. WHEN a Clause receives a RiskLevel of `high` or `critical`, THE Platform SHALL notify the Lead_Reviewer assigned to the Engagement within 60 seconds of the risk score being computed.
3. WHEN a Reviewer is @mentioned in an annotation, THE Platform SHALL deliver an in-app notification to the mentioned user within 10 seconds.
4. WHEN an Engagement deadline is within 24 hours and review is incomplete, THE Platform SHALL send a reminder notification to the Engagement_Manager and all Lead_Reviewers.
5. THE Platform SHALL support webhook delivery of notification events to external systems configured by the Tenant_Admin.

---

### Requirement 13: Contracts View (Portfolio)

**Wireframe**: `wirframes/version_02/design_handoff_ci_redesign/screens/portfolio.html`
**Component reference**: `screens-b.jsx:1778` (`PortfolioScreen`)
**Route**: `/contracts`
**Layout variants**: `table` (default) | `cards` | `minimal`

**Epic / Parent story**

> **As a** legal/ops user at Northwind
> **I want** a single screen that lists every contract in our portfolio with risk, flags, status, and quick filters
> **So that** I can find a specific contract, spot the riskiest deals at a glance, and drill into one for full results.

The epic decomposes into nine child stories. US-PORT-1..5 are the MVP slice; US-PORT-6..9 are follow-ups.

---

#### US-PORT-1 — Page shell, header & KPI strip

**As a** user landing on `/contracts`
**I want** a header with title/subtitle and a KPI strip summarising my portfolio
**So that** I get an at-a-glance read on portfolio health before I start filtering.

**Acceptance criteria**
- AC1: Page renders inside `PageShell` with title **"Contracts"** and subtitle **"{N} contracts on file at {orgName}"** where N = count of contracts whose status is `complete`.
- AC2: Header has two actions on the right: **Export CSV** (secondary) and **+ Upload** (primary). `+ Upload` navigates to the Upload screen.
- AC3: KPI strip shows exactly 5 cards in a 5-column grid (collapses to 3 on tablet, 2 on small, 1 on xs):
  1. **Total contracts** — count of all contracts, sub = "{complete} analysed"
  2. **Average risk** — mean `riskScore` over analysed contracts, 1 decimal, value tinted by risk colour, sub = "Out of 10.0"
  3. **Critical flags** — sum of `flags.red` across analysed contracts, value tinted red
  4. **Unlimited liability** — count of contracts with any risk flag whose title contains "unlimited", value tinted red
  5. **Urgent renewals** — count of renewals with `daysRemaining < 60`, tinted orange if >0 else green
- AC4: If the user has zero contracts, KPIs show `0` / `0.0` and the table area shows an empty state with a primary "Upload your first contract" CTA (see US-PORT-7).

---

#### US-PORT-2 — Filter strip (search, risk, type, sort)

**As a** user with many contracts
**I want** to search by name and filter by risk and type, and choose a sort order
**So that** I can narrow the list to what I care about right now.

**Acceptance criteria**
- AC1: Filter strip sits directly under the KPI strip, in a flex row that wraps on narrow viewports.
- AC2: **Search** is a free-text input (placeholder "Search contracts…"). Matching is case-insensitive substring against `contract.name`. Updates the list as the user types (debounced ~150ms).
- AC3: **Risk filter** select with options: `All risk`, `High (7+)`, `Medium (4–6.99)`, `Low (<4)`. Default `All`.
- AC4: **Type filter** select with options: `All types`, `Vendor`, `License`, `Partnership`, `Customer`, `Lease`, `NDA`. Default `All`. Matches `contract.type`.
- AC5: **Sort** select with options: `Sort: Risk` (riskScore desc), `Sort: Date` (uploadDate desc), `Sort: Name` (A→Z). Default `Sort: Risk`.
- AC6: Filters compose (search AND risk AND type), then sort is applied. The card header shows **"{filtered.length} shown"**.
- AC7: Empty filter result shows a "No contracts match these filters" message with a **Clear filters** link that resets all 4 controls to defaults.

---

#### US-PORT-3 — Contract table

**As a** user
**I want** a scannable table of contracts with key columns
**So that** I can compare contracts side by side.

**Acceptance criteria**
- AC1: Table renders inside a bordered card with a header "Contracts by risk score" and the filtered count.
- AC2: Columns rendered (in this order) match the wireframe: **#, Contract, Type, Risk, Flags, Expiry, Status** — 7 columns. Counterparty is rendered as the second line of the Contract cell (not its own column); Uploaded is not surfaced on this screen.
- AC3: **#** is a 1-based zero-padded index (`01`, `02`, …) in DM Mono.
- AC4: **Contract** cell shows the file name (with extension stripped) bold on line 1 and the first counterparty in muted text on line 2. Truncates with ellipsis at ~240px max width.
- AC5: **Type** renders the `TypePill` component for the contract type.
- AC6: **Risk** renders the `RiskBar` component for analysed contracts; shows `—` for `processing` / `failed`.
- AC7: **Flags** renders `FlagsSummary` (red/orange/blue counts) for analysed contracts; `—` otherwise.
- AC8: **Expiry** renders `terminationDate` in DM Mono; `—` if missing.
- AC9: **Status** renders:
  - `complete` → green `Complete` badge
  - `processing` → blue badge with pulsing dot animation
  - `failed` → red `Failed` badge. Row is non-interactive for v1 (no navigation, no modal); detailed retry UX is deferred.
- AC10: On horizontal overflow (≤860px viewport) the table scrolls horizontally with `min-width: 640px`.

---

#### US-PORT-4 — Row interaction & navigation

**As a** user
**I want** to click a contract row to drill into its results
**So that** I can review a specific contract in depth.

**Acceptance criteria**
- AC1: Hovering any row with `status === complete` changes the background to `T.bgAlt` and sets the cursor to pointer.
- AC2: Hovering a `processing` or `failed` row does **not** change the background and the cursor stays default.
- AC3: Clicking a `complete` row navigates to the Results screen for that contract (`/contracts/:id`).
- AC4: Clicking a `processing` or `failed` row is a no-op.
- AC5: Keyboard: rows are focusable (`tabindex=0`), `Enter` / `Space` activates the same navigation as click, focus ring visible.
- AC6: Each row has an accessible name (e.g., `aria-label="Open {contract name} — risk {score}, status {status}"`).

---

#### US-PORT-5 — Pagination

**As a** user with a long contract list
**I want** the table paginated so the page stays performant and scannable
**So that** I'm not scrolling through hundreds of rows.

**Acceptance criteria**
- AC1: Pagination is **server-side**: the list endpoint accepts `page` and `pageSize` query params and returns `{ items, page, pageSize, total, totalPages }`. Default `pageSize = 8`.
- AC2: Filter/search/sort params (`q`, `risk`, `type`, `sort`) are applied **server-side** alongside pagination — the server returns the filtered slice plus the filtered `total`.
- AC3: Pagination footer shows: `Showing {from}–{to} of {total}` on the left, and `← Prev | 1 2 3 … N | Next →` on the right. `from = (page-1)*pageSize + 1`, `to = from + items.length - 1`.
- AC4: Changing any filter, search, or sort resets to page 1 and re-fetches.
- AC5: Page and filter state are reflected in the URL (`?page=2&risk=high&sort=date`) so refresh and deep-links work.
- AC6: When `total ≤ pageSize`, the pagination footer is hidden.
- AC7: While a page change is in flight, the table shows a subtle loading overlay; previous rows stay visible to avoid layout jump.

---

#### US-PORT-6 — Layout variants

**As a** product owner
**I want** the screen to support `table | cards | minimal` layouts
**So that** we can A/B different densities without rebuilding the screen.

**Acceptance criteria**
- AC1: `PortfolioScreen` accepts a `layoutVariant` prop with values `table` (default), `cards`, `minimal`.
- AC2: `table` — current behaviour (US-PORT-3).
- AC3: `cards` — replaces `<tbody>` with a responsive grid of contract cards (each card shows name, type pill, risk bar, flags, expiry, status badge). All filter/sort/pagination behaviour from US-PORT-2/5 is identical.
- AC4: `minimal` — single-line rows: name + risk score + status only. No KPI strip rendered.
- AC5: Variant is settable via the Tweaks panel and via a URL param `?layout=cards`.

---

#### US-PORT-7 — Empty, loading, and error states

**As a** user
**I want** clear feedback when the list is loading, empty, or broken
**So that** I never see a blank page and always know what to do next.

**Acceptance criteria**
- AC1: **Loading** (initial fetch): KPI cards and table show shimmer skeletons; filter strip is disabled.
- AC2: **Empty (no contracts at all)**: replaces the table card with an empty state — icon, "No contracts yet", "Upload your first contract to get started", primary button → Upload screen. KPIs all render `0`.
- AC3: **Empty (filters return nothing)**: table card body renders the message in US-PORT-2 AC7.
- AC4: **Error**: if the list endpoint fails, table card shows an inline error with a **Retry** button; KPI strip stays as last-known-good or renders `—`.

---

#### US-PORT-8 — Responsive behaviour

**As a** user on tablet or phone
**I want** the screen to adapt cleanly to my viewport
**So that** the portfolio is usable away from my desk.

**Acceptance criteria**
- AC1: ≤1100px (lg): KPI grid stays 5-col, side column (if present) compresses.
- AC2: ≤860px (md): KPI grid → 3 cols; side column collapses below the table (`ci-portfolio-grid` → 1 column); table gains horizontal scroll.
- AC3: ≤640px (sm): KPI grid → 2 cols; padding reduces to 16px.
- AC4: ≤420px (xs): KPI grid → 1 col.
- AC5: Filter strip always wraps cleanly and never overflows horizontally.

---

#### US-PORT-9 — Export CSV

**As a** user
**I want** to export the currently-filtered list to CSV
**So that** I can share the slice or work with it offline.

**Acceptance criteria**
- AC1: Clicking **Export CSV** downloads a CSV named `contracts-{YYYY-MM-DD}.csv`.
- AC2: Export contains exactly the rows currently visible after filter+search+sort (all pages, not just the current page).
- AC3: Columns: `Name, Type, Counterparty, Risk Score, Red Flags, Orange Flags, Blue Flags, Expiry, Uploaded, Status`.
- AC4: Numeric values use `.` as decimal separator; dates ISO `YYYY-MM-DD`; commas in names are properly quoted.

---

#### Resolved scope decisions (2026-05-20)

- **Columns**: match the wireframe — 7 columns, counterparty inline, no Uploaded column.
- **Pagination**: in-scope, **server-side** (`page` + `pageSize=8`).
- **Filter/search/sort**: also **server-side**, share the same endpoint as pagination.
- **`failed` status**: in-scope — red `Failed` badge only. Row is non-interactive for v1; retry/details UX deferred.
- **KPIs + list bundled**: one endpoint returns both list slice and the 5 KPI values in a single round-trip.
- **Backend read model**: define a dedicated list projection (`DocumentListItem`) maintained via domain event handlers — do not lazy-map the `Document` aggregate.
- **URL state**: custom `useDocumentListFilters` hook, unit-testable in isolation from React Router.
- **Glossary**: "Contract" is the user-facing word; the domain term is `Document`. Every contract is backed by exactly one document (v1). No separate `Contract` aggregate. Route stays `/contracts` (product language); endpoint is `/api/documents` (domain language).
- **New endpoint**: there is no existing `GET /api/documents` list endpoint — Phase 10 introduces it.
- **Frontend data layer**: reuse the existing `react-query` v3 package already in `apps/frontend/package.json` — do not add TanStack Query v4/v5.

#### Still open

- **Side column (300px)** — the wireframe has a right-hand side column (`ci-portfolio-grid` is `1fr 300px`). Not covered by any story above; likely "Risk distribution + Upcoming renewals" mini-panels. To be scoped as a US-PORT-10 if/when we want it.

---

### Requirement 14: Clause Intelligence (Similar Clauses + Semantic Search)

**Phase**: 11
**Visual spec**: `docs/design/similar-clauses-visual.md`, `docs/design/semantic-search-visual.md`
**Implementation plan**: `docs/design/similar-clauses-impl-plan.md`
**User stories**: `USER_STORIES/US-010_Similar_Clauses.md`, `USER_STORIES/US-011_Semantic_Search.md`
**Depends on**: Requirement 3 (Clause Extraction and Classification) — clauses must be embedded.

**Epic / Parent story**

> **As a** legal reviewer at Northwind
> **I want** to leverage the clause embeddings we already produce — both by surfacing precedent for a clause I'm reading and by searching my portfolio in plain English
> **So that** I can negotiate from precedent instead of from memory, and find relevant contracts without remembering exact wording.

The epic decomposes into two child stories. **US-CI-1 (Similar Clauses) ships first** and lays the index + result-row components that **US-CI-2 (Semantic Search)** reuses. Both reduce to the same primitive: kNN over `Clause.embedding` via pgvector cosine distance.

---

#### US-CI-0 — Pre-flight: embedding coverage and pgvector index

**As a** platform engineer about to build clause-intelligence features
**I want** the database to have an HNSW index on `Clause.embedding` and every existing clause's embedding populated
**So that** the kNN queries that power Similar Clauses and Semantic Search return results in <300ms and so that no clause is silently invisible to those features.

**Acceptance criteria**
- AC1: Migration `20260521000000_phase11_clause_embedding_hnsw_index` creates `Clause_embedding_cosine_idx` as an HNSW index using `vector_cosine_ops`, built `CONCURRENTLY` so writes are not blocked.
- AC2: A backfill script `apps/backend/scripts/backfill-clause-embeddings.ts` exists and, when run, populates `embedding` (and `embeddingModelVersion`) on every clause where `embedding IS NULL` and `text` is non-empty.
- AC3: The backfill script is **idempotent** — re-running it after a partial failure only touches clauses still missing an embedding.
- AC4: The backfill script supports `--dry-run` (report what would change, no Voyage calls, no writes) and `--limit=N` (cap rows processed in this run).
- AC5: Permanent Voyage errors (auth / invalid request) abort the script with a non-zero exit code; transient errors (429 / 5xx / network) log the failing batch and continue, so a single retryable batch does not block the rest.
- AC6: After backfill, `SELECT type, COUNT(*) FILTER (WHERE embedding IS NOT NULL) AS embedded, COUNT(*) AS total FROM "Clause" GROUP BY type` reports `embedded = total` for every clause type present in the dataset.
- AC7: Every clause type intended to be clicked during the demo has **≥3 embedded rows in the portfolio** so the Similar Clauses drawer never falls flat on "no precedent found" during the demo. (If sparse, supplemental contracts are uploaded to satisfy this AC; satisfaction is *not* a code change.)

---

#### US-CI-1 — Similar Clauses (precedent lookup)

**As a** legal reviewer reading a clause in any contract
**I want** to click a button and see the 5 most semantically similar clauses we've signed across our portfolio
**So that** I can use precedent to decide whether the clause is acceptable, unusual, or worth pushing back on — without asking a paralegal or grepping PDFs.

**Acceptance criteria**

*Backend*
- AC1: `GET /api/v1/clauses/:id/similar?limit=5` returns the source clause summary plus a ranked list of up to `limit` (default 5, max 20) most-similar clauses by cosine similarity.
- AC2: Results exclude the source clause itself and exclude any other clause from the same `documentId`.
- AC3: Results are filtered to the same `clause.type` as the source (cross-type matches are out of scope for v1).
- AC4: Endpoint returns `404 clause_not_found` if the source clause does not exist, and `409 clause_not_embedded` if the source has `embedding IS NULL`.
- AC5: p95 latency < 300ms on a portfolio of ≥ 10,000 embedded clauses, measured against the HNSW index from US-CI-0.

*Frontend — trigger*
- AC6: A `Find similar` button appears on every clause card whose `embedding` is non-null. Clauses without an embedding render no trigger (not a disabled trigger).
- AC7: Pressing `F` while a clause is focused opens the drawer for that clause; the trigger button shows a loading state while the request is in flight.

*Frontend — drawer*
- AC8: A 480px right slide-over drawer opens with a 180ms ease-out animation, dims the background to ~20% opacity, and closes on `Esc`, backdrop click, or `✕`.
- AC9: The drawer header shows "Similar clauses"; a sticky **source block** at the top shows the user's clause (type, contract + section, 2-line snippet) visually de-emphasised.
- AC10: Each result row contains: similarity bar + `{n}% match`, clause type, `{document title} · {month YYYY}`, 2–3 line snippet, arrow icon. The entire row is one click target.
- AC11: Clicking a result row scrolls the main content to the target clause, applies a 2-second highlight ring, and the drawer stays open with the row marked `active` and a breadcrumb `Similar clauses › {Contract name} §{section}`.
- AC12: Clicking the source block at the top returns navigation to the source clause and clears the active row.

*States*
- AC13: **Loading** renders skeleton rows inside the drawer (no spinner).
- AC14: **Empty (no results)** renders a centred empty state with icon, headline "No similar clauses found yet", and explanation copy — see visual spec §4.2.
- AC15: **Single result** renders identically to multi-result but the header reads "1 similar clause".
- AC16: **Error** renders a plain message ("Couldn't load similar clauses") with a `Retry` button.

*Accessibility*
- AC17: Drawer has `role="dialog"`, `aria-modal="true"`, traps focus while open, and returns focus to the trigger button on close.
- AC18: Result rows are keyboard navigable: `↓`/`↑` move focus between rows; `Enter` activates the focused row.
- AC19: All interactive elements meet WCAG 2.1 AA (3px focus indicator, ≥4.5:1 contrast). Similarity bar exposes `aria-label="{n} percent match"`.

---

#### US-CI-2 — Semantic Contract Search

**As a** legal reviewer or contracts manager
**I want** to search my contracts in plain English from anywhere in the app
**So that** I can find relevant contracts and clauses by meaning, not by keyword, even when I don't remember the exact wording.

**Acceptance criteria**

*Backend*
- AC1: `GET /api/v1/search?q=...&limit=50` accepts a natural-language query and returns ranked `contracts` (max-clause similarity per document, with the matched clause as evidence) and `clauses` (raw similarity, regardless of document).
- AC2: The query pipeline is **HyDE**: an LLM call rewrites the user's query into a hypothetical clause; the rewritten text is embedded; kNN runs over `Clause.embedding`.
- AC3: If the HyDE LLM call fails, the endpoint gracefully degrades to embedding the raw query text directly — it does not return 5xx for this case.
- AC4: The response includes a `confidence` field equal to the top result's similarity. The frontend renders the low-confidence banner when `confidence < 0.55`.
- AC5: Results respect auth scope — only the requesting user's own portfolio is searched.
- AC6: p95 latency < 1.5s on a portfolio of ≥ 10,000 embedded clauses.

*Frontend — top-bar input*
- AC7: A persistent search input lives in the app header on every page with placeholder *"Search your contracts in plain English…"* and a right-aligned `⌘K` hint when unfocused.
- AC8: `⌘K` / `Ctrl+K` opens the overlay with the input focused from anywhere in the app.

*Frontend — overlay*
- AC9: The overlay slides down from the search bar with a strong backdrop (~50% opacity), closes on `Esc` / backdrop / `✕`, and debounces input by 600ms before firing the request.
- AC10: The overlay renders **two sections**: "Top contracts" (3 rows) and "Top clauses (across contracts)" (5 rows), each with a `See all ({n}) →` link that opens `/search?q=...&tab={contracts|clauses}`.
- AC11: Contract row anatomy: similarity bar · contract title · meta (signed date · deal size · counterparty) · "Matched on: {clause type} §{section}" · 2-line snippet. Clause row reuses `PrecedentRow` from US-CI-1 unchanged.
- AC12: Keyboard navigation: `↓`/`↑` move focus across all rows in both sections; `Enter` activates the focused row.

*Frontend — `/search` page*
- AC13: Reachable via the overlay's `See all →` link or by direct navigation; URL is the source of truth (`?q=...&tab=...&counterparty=...&from=...&to=...&sort=...`).
- AC14: Two tabs above results: `Contracts ({n})` and `Clauses ({n})`. Filter chip row offers Counterparty (multi-select) and Date range; sort dropdown offers `Best match` (default) · `Most recent` · `Largest deal`.
- AC15: Results paginate via "Load more" infinite scroll at 20 per page.

*Overlay states*
- AC16: **Empty (no query)** renders three suggested example queries; clicking one populates the input and fires the search.
- AC17: **Loading** renders skeleton rows in both sections.
- AC18: **Low confidence** renders a banner above the results: *"We didn't find a strong match. Showing closest results."*
- AC19: **No results** renders a centred empty state with a `Browse all contracts` CTA.
- AC20: **Error** renders a plain message with a `Retry` button.

*Accessibility*
- AC21: Overlay has `role="dialog"`, `aria-modal="true"`, traps focus while open, and returns focus to the header input on close.
- AC22: `/search` page tabs follow the WAI-ARIA tabs pattern; all result rows are focusable buttons with proper labels; search input has `role="searchbox"` and stays wired to URL state.

---

#### Resolved scope decisions (2026-05-21)

- **Sequencing**: hard gate — US-CI-2 does not start until US-CI-1 reaches Definition of Done. US-CI-2 explicitly reuses `SimilarityBar` and `PrecedentRow` from US-CI-1.
- **Index choice**: HNSW (not IVFFlat). No training step required and better recall at our scale.
- **Same-type filter in US-CI-1**: in-scope for v1. Cross-type matches are noisy and not worth the surface area.
- **HyDE in US-CI-2**: in-scope. Without it, short conversational queries score poorly against long formal clauses. The low-confidence banner (AC18) is the UX safety valve for poor HyDE rewrites.
- **Empty state for un-embedded clauses**: the `Find similar` trigger is **hidden, not disabled**, on un-embedded clauses. A disabled trigger advertises a feature the user cannot use.
- **Backfill before launch**: US-CI-0 must complete before either US-CI-1 or US-CI-2 ships. The pre-flight script + HNSW index migration are blocking dependencies.
- **Demo data density**: every clause type to be clicked during the demo requires ≥3 plausible precedents in the portfolio (US-CI-0 AC7). If sparse, supplemental contracts are uploaded — *not* a code change.

#### Out of scope (Phase 11) — deferred to later phases

- **Outlier detection** — Phase 12. Uses the same kNN primitive plus per-type centroid + percentile scoring.
- **Playbook matching** — Phase 13. Compares clauses against tiered "ideal / acceptable / fallback / red-line" reference embeddings.
- **Cross-type clause matching** — v2 of US-CI-1.
- **Accepted vs redlined status on results** — requires a negotiation outcome data model we don't have yet.
- **Highlighted matched phrases in snippets** — the matches are semantic, not lexical; there's no literal substring to highlight.
- **Saved searches, boolean operators, scoped search** — v2 of US-CI-2.

#### Still open

- **Bias `⌘K` search by current contract context** — e.g. when invoked from inside a contract, prefer matches from the same counterparty. Recommendation in PHASE_11_SPEC.md is *no* for v1; revisit after telemetry from US-CI-2 lands.
- **Similarity threshold for hiding low-quality matches in US-CI-1** — server-side pre-filter at 0.5? Or always show top 5 regardless? Recommendation: pre-filter at 0.5 in v1, surface "weak match" labelling in v2.
