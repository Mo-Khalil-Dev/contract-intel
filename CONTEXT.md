# Project Context

Key decisions and terminology that cut across multiple phases.
This file is the single source of truth for cross-cutting architecture choices.

---

## Glossary: Contract = Document (v1)

**User-facing word**: "Contract"
**Domain term**: `Document`

Every contract in the UI is backed by exactly one `Document` aggregate in the backend.
There is no separate `Contract` aggregate.

| Layer | Term used | Example |
|---|---|---|
| Product / UI / routes | Contract | `/contracts`, "Upload a contract" |
| Domain / API / database | Document | `/api/v1/documents`, `Document` aggregate, `documents` table |

### Why

The original domain model used `Document` because the system ingests arbitrary files
(PDFs, Word docs) and extracts clauses from them. "Contract" is the user-facing
interpretation of what those documents are. Introducing a separate `Contract` entity
in v1 would add an indirection layer (Document ↔ Contract join) with no benefit while
the two concepts remain 1-to-1.

### When this might change

If the platform ever needs:
- One contract backed by multiple documents (e.g. base agreement + amendments)
- Contract-level metadata that doesn't map to a single upload (e.g. a contract
  manually typed rather than uploaded)

...then a dedicated `Contract` aggregate should be introduced and the 1-to-1
equivalence retired. Until that point, avoid adding a `Contract` table or entity.

### Affected boundaries

- Frontend routes use `/contracts` (product language).
- Backend REST endpoints use `/api/v1/documents` (domain language).
- The `DocumentListItem` read model powers the Contracts View; it lives in
  `apps/backend/src/modules/documents/application/projections/`.
- The `useDocumentList` hook and `documentListService` on the frontend map
  `DocumentListResponse` directly to what the Contracts table/cards/minimal views consume.
