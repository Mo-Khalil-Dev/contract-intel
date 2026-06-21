# Handoff Brief — Ask Your Portfolio (Phase 12 / Requirement 15)

## What this feature is
A dedicated **`/ask` page** for the ContractIntel platform: a single plain-English question box with **answer cards stacked underneath**. Each question is classified into a query type, grounded in the user's already-extracted portfolio data, answered by Claude, and rendered as a type-specific card with validated citations. It is **separate** from the existing `⌘K` semantic search (that's retrieval and stays untouched).

## Current status: design + spec complete, no code yet
All planning/design is done and merged. Implementation has **not** started.

## Git state
- **Work branch**: `feature/phase-12-ask-your-portfolio` (branched off `Development`)
- **Everything is merged into `Development`** (latest: `06edc8d`); working tree clean
- Repo: `Mo-Khalil-Dev/contract-intel`. Commit only when asked; use the session's branch.

## Key documents (all on `Development`)
| File | Purpose |
|---|---|
| `DESIGN_PORTFOLIO_AI_CHAT.md` | Feature design, architecture, API |
| `FLOW_QUESTION_TO_ANSWER.md` | React → backend → Claude → UI flow |
| `PORTFOLIO_AI_CHAT_IMPLEMENTATION_PLAN.md` | Detailed implementation plan (schema, handlers, code examples) |
| `WIREFRAMES_ASK_PAGE.md` | Ask page layout spec |
| `WIREFRAMES_CHAT_RESPONSE_TYPES.md` | Per-query-type answer blocks |
| `wirframes/ask-page/ask-page.html` | **Interactive prototype** (open in browser) |
| `.kiro/specs/contract-analysis-platform/requirements.md` | **Requirement 15** (EARS acceptance criteria, US-AP-1..4) |
| `.kiro/specs/contract-analysis-platform/tasks.md` | **Phase 12** (build tasks 12.0–12.12) |

> Numbering: **Requirement 15** (the *what*) ↔ **Phase 12** (the *how*) — same feature, the spec's existing parallel-numbering convention.

## The 7 query types
`risk-analysis`, `comparison`, `timeline`, `clause-type-search`, `financial`, `document-specific`, `general` (fallback).

## Architecture principles (non-negotiable)
- **No re-extraction** — read existing clauses/metadata/risk (Phases 3/4) and embeddings/kNN (Phase 11); never re-run the pipeline.
- **Grounding over recall** — validate every citation against retrieved context; drop unbacked references.
- **Ports for testability** — Claude behind a `ClaudeAnswerService` interface (stub in tests); classifier is a pure function.
- **Query handler registry** — one handler per type; adding a type = adding a handler.
- **Reuse UI primitives** — `Badge`, `TypePill`, `SimilarityBar`, `ClauseCard`/`PrecedentRow`, `SuggestedSearches` pattern.
- **Auth-scoped** — only the requesting user's own portfolio.

## Tech context
NestJS + CQRS + Prisma (Clean Architecture) backend; React 18 + React Query + Tailwind frontend. Existing modules: `documents`, `clauses`, `auth`, `audit`, `reference-data`. Claude API key in env.

## Next step: the MVP vertical slice (risk only)
Build **Tasks 12.0 → 12.8** for the `risk-analysis` type end-to-end before fanning out:
1. **12.0** Prisma schema + migration (`ChatThread`/`ChatMessage`/`ChatFeedback`)
2. **12.1** `QueryClassifier` (pure) + `ContextBuilder` (read-side)
3. **12.2** `ClaudeAnswerService` (port+driver) + `PromptBuilder` + `CitationExtractor`
4. **12.3** `AskPortfolio` command handler
5. **12.4** `QueryHandlerRegistry` + risk handler
6. **12.5** `POST /api/v1/ask` controller + DTOs
7. **12.6** `useAskPortfolio` hook + `askService`
8. **12.7** `/ask` page (greeting, ask box, card stack)
9. **12.8** `AnswerCard` shell + risk result table

Then 12.9 (remaining types/blocks) → 12.10 (suggestions/citations) → 12.11 (history/feedback) → 12.12 (E2E).

## Deferred (out of scope for Phase 12)
SSE streaming, multi-turn memory, composite mixed-type answers, PDF export/share.

## Open questions to resolve during build
- `⌘K` collision (global search vs. page ask box)
- Card ordering (newest-on-top vs. append-and-scroll)
- Heuristic classifier vs. LLM classifier (start heuristic)
