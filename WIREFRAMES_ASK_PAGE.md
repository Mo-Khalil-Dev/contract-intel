# Wireframe: Portfolio "Ask" Page

**Decision (2026-06-21)**: Portfolio AI lives on its **own dedicated page** with a
single question box and **answer cards stacked underneath** — NOT inside the
top-nav ⌘K search overlay. The existing semantic search box stays untouched.

**Route**: `/ask` (or `/portfolio/ask`)
**Pattern**: ask → answer card → ask again (cards accumulate down the page)
**Design system**: ContractIntel — DM Sans UI · DM Mono numerals · Georgia italic snippets
**Accent**: `#2563EB` · gradient "Ask" button · status badges reuse risk palette

---

## Reference

Based on the provided mockup (a land/sites portfolio "Ask Atlas" pattern),
adapted to the **contracts** domain. The mockup's parcels/leases/hectares become
contracts/clauses/risk. Layout, hierarchy, and interactions are preserved.

---

## Page Anatomy

```
┌──────────────────────────────────────────────────────────────────────┐
│ Portfolio / Atlas    ● Live · 1,027 contracts   [All contracts ▾]      │ ← context bar
│                              [ 🔍 Search contracts…  ⌘K ]   [+ New]    │   (existing nav)
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                      GOOD AFTERNOON, PHIL                              │ ← greeting eyebrow
│                                                                        │   DM Mono 11px upper
│           What do you want to know about your portfolio?              │ ← hero, 28px/700
│                                                                        │
│        ┌──────────────────────────────────────────────────┐          │
│        │ ✦  Which contracts have unlimited liability?       ⌘K [Ask]│  │ ← ASK BOX
│        └──────────────────────────────────────────────────┘          │   centered, 1 line
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │ ✦ YOU ASKED                          → �↗ ↓ 🔖 ⤢ ✕            │   │ ← ANSWER CARD
│   │   Which contracts have unlimited liability?                    │   │   (one per question)
│   ├──────────────────────────────────────────────────────────────┤   │
│   │ Found 3 contracts with uncapped liability [1][2]. All are      │   │ ← prose answer
│   │ MSAs signed in 2026. Two are flagged critical [3] — SaaS       │   │   inline citations
│   │ Vendor (Risky Variant) and Globex MSA.                         │   │
│   │                                                                │   │
│   │ ┌────────┬──────────────────┬─────────────┬───────┬────────┐ │   │ ← RESULT TABLE
│   │ │ REF    │ CONTRACT          │ COUNTERPARTY│ VALUE │ RISK   │ │   │   (the answer block)
│   │ ├────────┼──────────────────┼─────────────┼───────┼────────┤ │   │
│   │ │ CT-204 │ SaaS Vendor       │ Acme Inc.   │ $2.4M │ ⬤ Crit │ │   │
│   │ │ CT-219 │ Globex MSA        │ Globex Corp.│ $1.1M │ ⬤ Crit │ │   │
│   │ │ CT-227 │ Initech Master    │ Initech Ltd.│ $480K │ ⬤ High │ │   │
│   │ ├────────┴──────────────────┴─────────────┴───────┴────────┤ │   │
│   │ │ Showing 3 of 3 · sorted by risk      Open in full view → │ │   │ ← table footer
│   │ └──────────────────────────────────────────────────────────┘ │   │
│   ├──────────────────────────────────────────────────────────────┤   │
│   │ Sources: 3 contracts · 5 clauses    Refine   Helpful? 👍 👎  │   │ ← card footer
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   [ next answer card stacks here when user asks again ]               │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 1. Hero + Greeting (top of page, first-run / empty)

```
                      GOOD AFTERNOON, PHIL                          ← time-aware eyebrow
                                                                       DM Mono 11px, #94A3B8
           What do you want to know about your portfolio?           ← #0F172A, 28px/700
```

- Greeting adapts to time of day + user's first name (from `@CurrentUser`).
- Hero headline only shows when there are **no answer cards yet** (first-run).
  Once the user asks, the hero shrinks / scrolls up and cards take over.

---

## 2. The Ask Box

```
┌────────────────────────────────────────────────────────────────┐
│ ✦   Which contracts have unlimited liability?         ⌘K  [Ask] │
└────────────────────────────────────────────────────────────────┘
```

- **Width**: max 720px, centered. Height ~52px (matches the large `SearchInput`).
- **Sparkle glyph** `✦` left: gradient (blue→violet) — the "AI" marker, distinct
  from the search magnifier. This is how users tell Ask apart from Search.
- **Placeholder**: *"Ask anything about your portfolio…"*
- **`⌘K` hint** + **`Ask` button** (gradient fill, white text) on the right.
  Enter submits; ⌘K focuses the box from anywhere on this page.
- On submit: box clears, a new answer card mounts below in `loading` state.

> Note: `⌘K` here focuses the Ask box (page-scoped). The global top-nav search
> still owns `⌘K` app-wide — on `/ask` the page handler takes precedence while
> focused. (Confirm during build; may use a different key to avoid collision.)

---

## 3. Answer Card

The heart of the page. One card per question, stacked newest-first (or
appended — see open questions). Card = header + body block + footer.

### 3a. Card Header
```
✦ YOU ASKED                                  →  ↗  ↓  🔖  ⤢  ✕
  Which contracts have unlimited liability?
```
- Eyebrow `YOU ASKED` (DM Mono 10px upper `#94A3B8`) + question (15px/700).
- Action icons (right):
  | Icon | Action |
  |---|---|
  | → | Ask follow-up (seeds box with context) |
  | ↗ | Share / copy link |
  | ↓ | Export (CSV / PDF) |
  | 🔖 | Bookmark this answer |
  | ⤢ | Expand to full view |
  | ✕ | Dismiss card |
- Header has a subtle tinted background (`#F5F3FF` / violet-50) to signal "AI".

### 3b. Card Body — the type-specific block
The prose lead-in is always present. Below it, the **answer block** is chosen by
query type (the renderers from `WIREFRAMES_CHAT_RESPONSE_TYPES.md`):

```
Found 3 contracts with uncapped liability [1][2]. Two are flagged
critical [3] — SaaS Vendor and Globex MSA.

[ result block: table | ranked list | comparison | timeline | financial | … ]
```

- **Inline citations** `[1] [2] [3]`: superscript chips, `#2563EB`, click →
  scrolls to / opens the cited contract or clause. Map to the Sources footer.
- The table shown in the mockup IS the `ranked-list` / `clause-list` block
  rendered in table form. Same data, card-framed.

### 3c. Result Table (most common block)
```
┌────────┬──────────────────┬──────────────┬───────┬────────┐
│ REF    │ CONTRACT          │ COUNTERPARTY │ VALUE │ RISK   │
├────────┼──────────────────┼──────────────┼───────┼────────┤
│ CT-204 │ SaaS Vendor       │ Acme Inc.    │ $2.4M │ ⬤ Crit │
│ CT-219 │ Globex MSA        │ Globex Corp. │ $1.1M │ ⬤ Crit │
│ CT-227 │ Initech Master    │ Initech Ltd. │ $480K │ ⬤ High │
├────────┴──────────────────┴──────────────┴───────┴────────┤
│ Showing 3 of 3 · sorted by risk         Open in full view →│
└────────────────────────────────────────────────────────────┘
```
- **Column headers**: DM Mono 11px upper `#64748B`.
- **REF**: DM Mono, muted (like the mockup's PARCEL ID).
- **Status/Risk badge**: reuse existing `Badge` + risk palette
  (Critical `#EF4444` · High `#F59E0B` · Active/Low `#10B981` · New `#2563EB`).
- **Footer row**: `Showing N of M · sorted by <x>` left;
  `Open in full view →` right → navigates to `/contracts?filter=…` pre-applied.
- Truncates to ~5 rows; full set behind "Open in full view".

### 3d. Card Footer
```
Sources: 3 contracts · 5 clauses        Refine     Was this helpful? 👍 👎
```
- **Sources**: count of grounding docs/clauses (the citation provenance).
  Clicking expands the actual cited list.
- **Refine**: re-opens the ask box seeded with this question to narrow it.
- **Feedback** 👍/👎: writes to `ChatFeedback` (already in the schema) — drives
  classifier/prompt improvement over time.

---

## 4. States

### Loading (just asked)
```
✦ YOU ASKED
  Which contracts have unlimited liability?
─────────────────────────────────────────────
  ▌▌▌  Searching your portfolio…        ← shimmer dots, then streams in (Phase 3)
```

### Empty result
```
  No contracts match that. Your portfolio has no uncapped-liability
  clauses on record — every MSA caps liability at fees paid.
  Sources: 0 contracts          Was this helpful? 👍 👎
```

### Error
```
  ⚠ I couldn't complete that search. This is usually transient.   [ Retry ]
```

### Empty portfolio (no contracts at all)
```
  You have no analysed contracts yet.   [ Upload a contract → ]
```

---

## 5. First-Run Suggestions (no cards yet)

Under the ask box, show the canned questions (reuse `SuggestedSearches` pattern,
chat-phrased, one per query type so every renderer is reachable):

```
        TRY ASKING…
        ✦ "What are my highest risk contracts?"          → risk
        ✦ "Which contracts expire in the next 90 days?"  → timeline
        ✦ "Compare payment terms across my contracts"    → comparison
        ✦ "Show me all unlimited liability clauses"      → clause-type
```
Clicking one fills the ask box (does not auto-submit — consistent with search).

---

## Component Structure

```
apps/frontend/src/pages/AskPage/
├── AskPage.tsx                  route /ask — owns layout + question list
├── AskHero.tsx                  greeting + headline (first-run only)
├── AskBox.tsx                   the input + sparkle + Ask button + ⌘K
├── AnswerCard.tsx              header + body + footer shell (one per question)
├── AnswerCardHeader.tsx        YOU ASKED + action icons
├── AnswerCardFooter.tsx        Sources + Refine + feedback
├── blocks/                      ← shared with chat response-type wireframes
│   ├── ResultTableBlock.tsx     the table (ranked-list/clause-list as table)
│   ├── ComparisonTableBlock.tsx
│   ├── TimelineBlock.tsx
│   ├── FinancialSummaryBlock.tsx
│   ├── DocSummaryBlock.tsx
│   └── ProseBlock.tsx
├── Citation.tsx                inline [1] chip + scroll-to
└── SuggestedQuestions.tsx      first-run list (reuses SuggestedSearches look)
```

### Reuse (don't rebuild)
- `Badge` → status/risk badges in the table
- `TypePill` → contract type chips
- `SimilarityBar` → financial share bars
- `SuggestedSearches` pattern → first-run suggestions
- Risk severity palette → status colors

---

## How this reconciles with prior docs

- **Entry point question (answered)**: dedicated page wins over ⌘K overlay.
  → Update `DESIGN_PORTFOLIO_AI_CHAT.md` UI section to point here.
- **Response-type wireframes still apply**: each block now renders *inside an
  AnswerCard body* instead of a chat bubble. Same renderers, new frame.
- **Conversation model softens**: this is "ask → card" (cards stack), closer to
  Perplexity/Notion-AI than a chat thread. We still persist `ChatThread`/
  `ChatMessage` (one thread per page session; each Q&A = a user+assistant pair),
  so the backend plan is unchanged — only the frontend framing differs.

---

## Open Questions for Design Review

1. **Card order** — newest card on top (push down older) or append at bottom
   (chat-style, auto-scroll)? Mockup implies one card under the box; recommend
   **newest-on-top** so the ask box stays reachable without scrolling.
2. **Follow-ups** — does `→ Ask follow-up` carry prior context (true conversation)
   or start fresh? Phase 1: fresh. Phase 2: context-aware follow-ups.
3. **⌘K collision** — page Ask box vs global search both want ⌘K. Options: page
   takes ⌘K only while `/ask` is active, or give Ask a different shortcut (e.g. ⌘J).
4. **Result columns are query-dependent** — a financial question needs Value/Terms
   columns; a timeline needs Expiry/Notice. The block renderer picks columns from
   `structuredData`; the table is not one fixed schema.
```
