# Frontend Architecture: Backend-Driven Declarative UI

## Philosophy

> "If it's not in the response, it doesn't exist."

The frontend is a **view engine**, not a smart client. The backend makes all decisions. The frontend renders what the backend tells it to render — nothing more.

```
Backend: "You CAN approve"     → Frontend: render approve button
Backend: "You CANNOT approve"  → Frontend: render disabled button + reason
Backend: "Here's the error"    → Frontend: display the error exactly as provided
```

**Never:**

```typescript
// ❌ Frontend calculating permissions
if (user.role === 'lead_reviewer' && clause.reviewedByReviewer) {
  showApprove();
}

// ✅ Frontend reading backend decision
if (clause.actions.canApprove.allowed) {
  showApprove();
}
```

---

## The 11 Layers

```
┌─────────────────────────────────────────┐
│ Layer 11: Page Components (Smart)       │  ← Orchestrates hooks + components
├─────────────────────────────────────────┤
│ Layer 10: Presentation Components       │  ← Pure rendering, no logic
├─────────────────────────────────────────┤
│ Layer 9: State Management               │  ← Local UI state only (React state/Zustand)
├─────────────────────────────────────────┤
│ Layer 8: Data Fetching & Hooks          │  ← Fetch from backend, no business logic
├─────────────────────────────────────────┤
│ Layer 7: Formatting & Display Logic     │  ← Date format, truncate, number format only
├─────────────────────────────────────────┤
│ Layer 6: API Client                     │  ← Thin HTTP wrapper, auto-unwrap
├─────────────────────────────────────────┤
│ Layer 5: Type Definitions               │  ← Mirror of backend response shape
├─────────────────────────────────────────┤
│ Layer 4: Error Display                  │  ← Show what backend says, nothing more
├─────────────────────────────────────────┤
│ Layer 3: Utilities (pure)               │  ← formatDate, truncate, formatBytes
├─────────────────────────────────────────┤
│ Layer 2: Config & Constants             │  ← API base URL, env vars, route paths
├─────────────────────────────────────────┤
│ Layer 1: Design System                  │  ← Colors, spacing, typography, tokens
└─────────────────────────────────────────┘
```

---

## Backend API Contract

Every response includes `actions` (what's allowed) and `ui` (how to display).

### Document Response

```typescript
interface DocumentResponse {
  id: string;
  fileName: string;
  status: DocumentStatus;
  fileSizeBytes: number;
  createdAt: string;

  actions: {
    canDelete: ActionPermission;
    canReprocess: ActionPermission;
    canExport: ActionPermission;
    canAssignToEngagement: ActionPermission;
  };

  ui: {
    statusLabel: string; // "Analysis Complete"
    statusColor: 'green' | 'yellow' | 'red' | 'gray';
    riskBadge?: string; // "HIGH RISK"
    riskBadgeColor?: string;
    processingProgress?: number; // 0-100 while processing
  };
}
```

### Clause Response

```typescript
interface ClauseResponse {
  id: string;
  type: ClauseType;
  text: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reviewStatus: ClauseReviewStatus;

  actions: {
    canApprove: ActionPermission; // requires prior reviewer review
    canFlag: ActionPermission;
    canEscalate: ActionPermission;
    canAnnotate: ActionPermission;
    canWaive: ActionPermission;
  };

  ui: {
    riskBadgeColor: string;
    highlightColor: string;
    reviewStatusLabel: string; // "Pending Review", "Approved", etc.
    riskExplanation: string; // human-readable risk summary
  };
}
```

### Engagement Response

```typescript
interface EngagementResponse {
  id: string;
  name: string;
  status: EngagementStatus;
  reviewProgress: number;

  actions: {
    canActivate: ActionPermission; // requires lead_reviewer assigned
    canAddDocument: ActionPermission;
    canAssignReviewer: ActionPermission;
    canClose: ActionPermission;
    canExportReport: ActionPermission;
  };

  ui: {
    progressLabel: string; // "45 of 120 clauses reviewed"
    statusLabel: string;
    statusColor: string;
    deadlineWarning?: string; // "Due in 2 days"
    deadlineWarningColor?: string;
  };
}
```

### ActionPermission Type

```typescript
interface ActionPermission {
  allowed: boolean;
  reason?: string; // why it's not allowed
  blockedReason?: string; // user-facing message
  helpText?: string; // guidance on how to unblock
  confirmation?: string; // confirmation dialog text if allowed
}
```

---

## Layer Implementations

### Layer 5: Type Definitions

Types mirror backend response shapes exactly. No business logic definitions.

```typescript
// src/types/api.ts
export interface ActionPermission {
  allowed: boolean;
  reason?: string;
  blockedReason?: string;
  helpText?: string;
  confirmation?: string;
}

export interface DocumentResponse {
  id: string;
  fileName: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  actions: {
    canDelete: ActionPermission;
    canReprocess: ActionPermission;
    canExport: ActionPermission;
  };
  ui: {
    statusLabel: string;
    statusColor: string;
    riskBadge?: string;
  };
}
```

### Layer 6: API Client

Thin HTTP wrapper with automatic response unwrapping. No business logic.

```typescript
// src/lib/api-client.ts
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Attach session cookie automatically (credentials: 'include')
client.defaults.withCredentials = true;

// Unwrap ApiResponse<T> automatically
client.interceptors.response.use(
  (response) => response.data.data ?? response.data,
  (error) => Promise.reject(error.response?.data?.error ?? error),
);

// Per-resource API modules
export const documentsApi = {
  list: (params?: ListParams) => client.get<DocumentResponse[]>('/api/v1/documents', { params }),
  get: (id: string) => client.get<DocumentResponse>(`/api/v1/documents/${id}`),
  upload: (formData: FormData) => client.post<DocumentResponse>('/api/v1/documents', formData),
  delete: (id: string) => client.delete(`/api/v1/documents/${id}`),
};

export const clausesApi = {
  list: (documentId: string) =>
    client.get<ClauseResponse[]>(`/api/v1/documents/${documentId}/clauses`),
  get: (id: string) => client.get<ClauseResponse>(`/api/v1/clauses/${id}`),
  updateStatus: (id: string, status: ClauseReviewStatus) =>
    client.patch<ClauseResponse>(`/api/v1/clauses/${id}/status`, { status }),
};
```

### Layer 7: Formatting & Display Logic

Only transforms data for display. Never validates, never decides.

```typescript
// src/lib/formatters.ts

// ✅ Allowed — display transformation
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(iso));

export const truncate = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

// ❌ NOT allowed — business logic
// export const canUserApprove = (user, clause) => ...
// export const calculateRiskLevel = (score) => ...
```

### Layer 8: Data Fetching & Hooks

Fetch, cache, update. No business logic.

```typescript
// src/hooks/useClause.ts
export function useClause(id: string) {
  const [clause, setClause] = useState<ClauseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    clausesApi
      .get(id)
      .then(setClause)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = useCallback(
    async (status: ClauseReviewStatus) => {
      // Send to backend. Backend decides if it's allowed.
      const updated = await clausesApi.updateStatus(id, status);
      // Backend sends back new state with updated actions
      setClause(updated);
    },
    [id],
  );

  return { clause, loading, error, updateStatus };
}
```

### Layer 10: Presentation Components

Pure rendering. Receive data as props, render it. No fetching, no decisions.

```typescript
// src/components/ClauseActions.tsx
interface Props {
  actions: ClauseResponse['actions']
  onApprove: () => void
  onFlag: () => void
  onEscalate: () => void
}

export function ClauseActions({ actions, onApprove, onFlag, onEscalate }: Props) {
  return (
    <div className="flex gap-2">
      {/* Backend decides if approve is shown */}
      {actions.canApprove.allowed ? (
        <Button onClick={onApprove} variant="success">Approve</Button>
      ) : (
        <Tooltip content={actions.canApprove.blockedReason}>
          <Button disabled variant="success">Approve</Button>
        </Tooltip>
      )}

      {actions.canFlag.allowed && (
        <Button onClick={onFlag} variant="warning">Flag</Button>
      )}

      {actions.canEscalate.allowed && (
        <Button
          onClick={() => {
            if (actions.canEscalate.confirmation && !confirm(actions.canEscalate.confirmation)) return
            onEscalate()
          }}
          variant="danger"
        >
          Escalate
        </Button>
      )}
    </div>
  )
}
```

### Layer 11: Page Components

Orchestrate hooks and components. Read backend response. No conditionals based on calculations.

```typescript
// src/pages/ClauseReviewPage.tsx
export function ClauseReviewPage() {
  const { id } = useParams<{ id: string }>()
  const { clause, loading, error, updateStatus } = useClause(id!)

  if (loading) return <Spinner />
  if (error) return <ErrorDisplay error={error} />
  if (!clause) return <NotFound />

  return (
    <div>
      {/* Risk badge — backend provides color and label */}
      <RiskBadge
        label={clause.ui.riskBadge}
        color={clause.ui.riskBadgeColor}
      />

      {/* Clause text */}
      <ClauseText text={clause.text} highlightColor={clause.ui.highlightColor} />

      {/* Risk explanation from backend */}
      <Alert type="warning">{clause.ui.riskExplanation}</Alert>

      {/* Actions — backend decides what's allowed */}
      <ClauseActions
        actions={clause.actions}
        onApprove={() => updateStatus('approved')}
        onFlag={() => updateStatus('flagged')}
        onEscalate={() => updateStatus('escalated')}
      />
    </div>
  )
}
```

---

## What Layer 7 Is NOT

Layer 7 is **Formatting & Display Logic** — not business logic.

| ✅ Allowed in Layer 7                   | ❌ Not allowed in Layer 7    |
| --------------------------------------- | ---------------------------- |
| Format date for display                 | Validate answers             |
| Truncate long text                      | Check permissions            |
| Format file size (bytes → MB)           | Calculate eligibility        |
| Format risk score (75 → "75%")          | Apply business rules         |
| Derive display color from status string | Determine if user can submit |

---

## Benefits for This Platform

| Concern                               | Old approach                         | Backend-driven                          |
| ------------------------------------- | ------------------------------------ | --------------------------------------- |
| "Can reviewer approve?"               | Frontend checks role + review status | Backend says in `actions.canApprove`    |
| "What's the risk badge color?"        | Frontend maps riskLevel → color      | Backend provides in `ui.riskBadgeColor` |
| "Is deadline warning shown?"          | Frontend calculates days remaining   | Backend provides `ui.deadlineWarning`   |
| "Can engagement be activated?"        | Frontend checks reviewer count       | Backend says in `actions.canActivate`   |
| Rule change (e.g. approval threshold) | Change backend + frontend            | Change backend only                     |

---

## Implementation Checklist

- [ ] Every API response includes `actions` (what's allowed)
- [ ] Every API response includes `ui` (how to display)
- [ ] Frontend never calculates permissions — always reads from `actions`
- [ ] Frontend never implements business rules — always reads from response
- [ ] Types in Layer 5 mirror backend response shapes exactly
- [ ] API client (Layer 6) is thin — just HTTP, no decision-making
- [ ] Hooks (Layer 8) fetch and cache — no business logic
- [ ] Components (Layer 10) are pure rendering — no conditionals based on calculations
- [ ] Pages (Layer 11) orchestrate — no `if (answers.length === total)` style checks
- [ ] Backend tests cover all business logic
- [ ] Frontend tests cover rendering only
