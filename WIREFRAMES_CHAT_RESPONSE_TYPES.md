# Wireframes: Chat Response Types

**Feature**: Portfolio AI Chat — per-question-type response rendering
**Design system**: ContractIntel (DM Sans UI / DM Mono numerals / Georgia italic snippets)
**Accent**: `#2563EB` · Strong `#1D4ED8` · Risk red `#EF4444` · amber `#F59E0B` · green `#10B981`

---

## Core Principle

Every assistant message shares the **same shell** (avatar, prose intro, citations footer)
but renders a **type-specific body block** based on `metadata.format`. The classifier picks
the query type → the handler returns `structuredData` → the frontend picks a renderer.

```
QueryType            → metadata.format   → React renderer
─────────────────────────────────────────────────────────
risk-analysis        → 'ranked-list'     → <RiskRankingBlock>
comparison           → 'comparison'      → <ComparisonTableBlock>
timeline             → 'timeline'        → <TimelineBlock>
clause-type-search   → 'clause-list'     → <ClauseListBlock>
financial            → 'financial'       → <FinancialSummaryBlock>
document-specific    → 'doc-summary'     → <DocSummaryBlock>
general              → 'prose'           → plain markdown
```

---

## The Shared Chat Shell

```
┌────────────────────────────────────────────────────────────┐  Panel: 480px
│  Portfolio AI                                          ✕     │  (drawer) or
├────────────────────────────────────────────────────────────┤  full /chat page
│                                                              │
│                          ┌─────────────────────────────┐    │
│                          │ What are my highest risk     │    │ ← user bubble
│                          │ contracts?                   │    │   right-aligned
│                          └─────────────────────────────┘    │   #0F172A bg
│                                                              │
│   ◆ Portfolio AI                                             │ ← assistant
│   ┌──────────────────────────────────────────────────┐     │   left-aligned
│   │ [TYPE-SPECIFIC BODY BLOCK RENDERS HERE]           │     │
│   └──────────────────────────────────────────────────┘     │
│                                                              │
│   References: [📄 SaaS Vendor]  [📄 Globex MSA]             │ ← citations
│                                                              │
├────────────────────────────────────────────────────────────┤
│  Ask about your portfolio…                          [ ➤ ]   │ ← input
└────────────────────────────────────────────────────────────┘
```

Shared elements (all types): assistant glyph `◆`, prose lead-in sentence,
citation chips footer, copy-to-clipboard on hover.

---

## 1. Risk Analysis  →  `<RiskRankingBlock>`

**Question**: *"What are my highest risk contracts?"*

A ranked list. Each row carries a severity stripe (left 4px border), the risk
score as a DM Mono numeral, and a one-line "why". Reuses the severity palette
from the existing risk flags.

```
◆ Portfolio AI
I found 3 contracts with critical risk exposure, ranked below.

┌──────────────────────────────────────────────────────────┐
│▌ 1.  SaaS Vendor — Risky Variant            ⬤ 85  CRITICAL│ ← red stripe
│      Uncapped liability — no limit on damages exposure.   │   #EF4444
│      §9.2 Limitation of Liability                         │
├──────────────────────────────────────────────────────────┤
│▌ 2.  Globex MSA                             ⬤ 72  HIGH    │ ← orange stripe
│      Buyer indemnifies vendor without cap or limitation.  │   #F59E0B
│      §11.1 Indemnification                                │
├──────────────────────────────────────────────────────────┤
│▌ 3.  Initech Master Services                ⬤ 68  HIGH    │
│      Auto-renewal with only 15 days notice to exit.       │
│      §3.2 Auto-Renewal                                    │
└──────────────────────────────────────────────────────────┘

References: [📄 SaaS Vendor]  [📄 Globex MSA]  [📄 Initech]
```

- **Score chip** `⬤ 85`: DM Mono, color = severity. min-width 56px, right-aligned.
- **Severity stripe**: 4px left border (red/orange/green) — same tokens as `ClauseCard`.
- **Row click** → navigates to `/results/:id?tab=risk-flags`.
- Sort always descending by `riskScore`.

---

## 2. Comparison  →  `<ComparisonTableBlock>`

**Question**: *"Compare payment terms across my contracts"*

A compact table. Columns are the compared dimension; rows are contracts. The
"best" / "worst" cells get a subtle tint so the eye lands on outliers.

```
◆ Portfolio AI
Here's how payment terms compare across 4 contracts.

┌─────────────────────┬───────────┬──────────┬─────────────┐
│ Contract            │ Amount    │ Terms    │ Escalation  │
├─────────────────────┼───────────┼──────────┼─────────────┤
│ SaaS Vendor         │ $2.4M     │ Net 15 ▲ │ 7% annual ▲ │ ← ▲ = unfavorable
│ Globex MSA          │ $1.1M     │ Net 30   │ 3% annual   │   (amber tint)
│ Initech Master      │ $480K     │ Net 45 ▼ │ None ▼      │ ← ▼ = favorable
│ Hooli Order Form    │ $680K     │ Net 30   │ CPI-linked  │   (green tint)
└─────────────────────┴───────────┴──────────┴─────────────┘

▲ less favorable to you   ▼ more favorable to you

References: [📄 SaaS Vendor]  [📄 Globex]  [📄 Initech]  [📄 Hooli]
```

- **Header row**: DM Mono 11px uppercase, `#64748B`.
- **Cell values**: verbatim from extracted `metadata` (Net 15, $2.4M…).
- **▲ / ▼ markers**: computed by the handler (best/worst per column), tinted
  `#FEF3C7` (amber-bg) / `#DCFCE7` (green-bg).
- On narrow (drawer) widths → table becomes **stacked cards** (one per contract,
  label:value rows) instead of horizontal scroll.

---

## 3. Timeline  →  `<TimelineBlock>`

**Question**: *"Which contracts expire in the next 90 days?"*

A vertical timeline sorted by urgency. Each node shows days-remaining as the
primary scannable signal, plus the required notice deadline (the real action date).

```
◆ Portfolio AI
3 contracts need attention in the next 90 days.

   │
  ⬤  18 days   ·  SaaS Vendor — Risky Variant            URGENT
   │            Expires 09 Jul 2026 · notice due in 3 days
   │            ⚠ 15-day notice — act by 06 Jul
   │
  ⬤  44 days   ·  Hooli Order Form
   │            Expires 04 Aug 2026 · 30-day notice
   │            Act by 05 Jul to prevent auto-renewal
   │
  ⬤  71 days   ·  Globex MSA
                 Expires 31 Aug 2026 · 60-day notice
                 Act by 02 Jul

References: [📄 SaaS Vendor]  [📄 Hooli]  [📄 Globex]
```

- **Days chip** `18 days`: DM Mono, color escalates — `<21` red, `<45` amber, else slate.
- **URGENT badge**: red pill when notice deadline is within 7 days.
- **Auto-renewal warning** `⚠`: only shown when the clause has the `auto_renewal` flag.
- Node dot color matches the days-chip severity.

---

## 4. Clause-Type Search  →  `<ClauseListBlock>`

**Question**: *"Show me all indemnification clauses"*

Reuses the **existing `PrecedentRow` / clause card** look (Georgia italic snippet,
section pin). This is the closest to the Similar-Clauses drawer you already shipped.

```
◆ Portfolio AI
Found 4 indemnification clauses across your portfolio.

┌──────────────────────────────────────────────────────────┐
│ Indemnification                          High risk · §11.1│
│ "Buyer shall defend, indemnify, and hold harmless Vendor  │ ← Georgia
│  from any and all claims… without cap or limitation."     │   italic
│ Globex MSA · Mar 2026                                      │   #334155
├──────────────────────────────────────────────────────────┤
│ Indemnification                       Low risk · §8.3      │
│ "Each party shall indemnify the other for third-party     │
│  claims arising from its own negligence."                 │
│ Initech Master Services · Feb 2026                        │
└──────────────────────────────────────────────────────────┘
                    [ Show 2 more ]

References: [📄 Globex]  [📄 Initech]
```

- Snippet: Georgia 13px italic, `-webkit-line-clamp: 3` — identical to `ClauseCard`.
- Severity badge: reuse existing `Badge` (High risk / Caution / Low risk).
- Row click → `/results/:id?tab=clauses&clause=:key` (deep-link, like search page).
- Collapses past 3 with a **Show N more** button.

---

## 5. Financial  →  `<FinancialSummaryBlock>`

**Question**: *"What's my total payment obligation?"*

A headline number (the answer), then a contributing breakdown. The total is the
hero; the rows justify it.

```
◆ Portfolio AI
Your total committed spend across 4 active contracts:

      ┌────────────────────────────────┐
      │   TOTAL OBLIGATION             │
      │   $4.66M                       │  ← DM Mono, 28px, #0F172A
      │   across 4 contracts          │
      └────────────────────────────────┘

   SaaS Vendor — Risky Variant      $2.4M   ████████████░░  52%
   Globex MSA                       $1.1M   █████░░░░░░░░░  24%
   Hooli Order Form                 $680K   ███░░░░░░░░░░░  15%
   Initech Master Services          $480K   ██░░░░░░░░░░░░  10%

References: [📄 SaaS Vendor]  [📄 Globex]  [📄 Hooli]  [📄 Initech]
```

- **Hero number**: DM Mono 28px, computed total (handler sums `paymentAmount`).
- **Mini bars**: share-of-total, reuse `SimilarityBar` geometry (6px, accent fill).
- **Caveat line** (when amounts can't be parsed): *"2 contracts excluded — amount
  not stated in machine-readable form."* (we copy amounts verbatim, so this matters).

---

## 6. Document-Specific  →  `<DocSummaryBlock>`

**Question**: *"Summarize the SaaS Vendor agreement"*

A structured fact-sheet for one contract: metadata grid on top, then risk + key
clauses. Essentially a compact version of the Results page Overview tab.

```
◆ Portfolio AI
Here's a summary of SaaS Vendor — Risky Variant.

┌──────────────────────────────────────────────────────────┐
│ SaaS Vendor — Risky Variant              MSA · ⬤ 85 CRIT │
├──────────────────────────────────────────────────────────┤
│ Parties      Acme Inc. (Vendor) · YourCo (Buyer)         │
│ Effective    12 Apr 2026                                   │
│ Term         1 year, auto-renews                          │
│ Value        $2.4M · Net 15                               │
│ Notice       15 days                                       │
├──────────────────────────────────────────────────────────┤
│ ⚠ Top risks                                               │
│  • Uncapped liability (§9.2) — critical                   │
│  • Auto-renewal, 15-day notice (§3.2) — high              │
│  • Vendor-only termination right (§12.1) — high           │
└──────────────────────────────────────────────────────────┘

[ Open full contract → ]    References: [📄 SaaS Vendor]
```

- **Metadata grid**: label (DM Mono 11px `#64748B`) : value (DM Sans, verbatim).
- **Risk score chip**: same `⬤ 85 CRIT` component as the ranking block.
- Single primary CTA → `/results/:id`.

---

## 7. General / Fallback  →  plain prose

**Question**: *"What should I watch out for in my portfolio?"* (no clean type match)

No special block — just well-formatted markdown from Claude, with citation chips.
This is the safety net when the classifier returns `general`.

```
◆ Portfolio AI
A few things stand out across your portfolio:

Your SaaS Vendor agreement carries the most exposure — it pairs
uncapped liability with a vendor-only termination right. I'd
prioritise renegotiating §9.2 there.

More broadly, 3 of your 4 contracts auto-renew, so I'd set
calendar reminders ahead of each notice window.

References: [📄 SaaS Vendor]  [📄 Globex]
```

---

## Shared States (all types)

### Loading (streaming not yet started)
```
◆ Portfolio AI
   ▌ ▌ ▌   ← three pulsing dots, ci-shimmer
```

### Streaming (Phase 3)
```
◆ Portfolio AI
I found 3 contracts with critical risk exposu▊   ← cursor, text fills in
```

### Empty portfolio
```
◆ Portfolio AI
You don't have any analysed contracts yet. Upload a contract
and I'll be able to answer questions about it.
              [ Upload a contract → ]
```

### Error
```
◆ Portfolio AI
⚠ I couldn't reach the analysis service. This is usually
  transient — try asking again in a moment.            [ Retry ]
```

---

## Empty / First-Run (no messages)

Reuses the **SuggestedSearches** pattern from semantic search — but with
chat-phrased questions, each mapped to a query type so we can demo every renderer.

```
◆ Talk to your portfolio

   Ask anything about your contracts in plain English.

   TRY ASKING…
   ┌────────────────────────────────────────────────┐
   │ 🔍 "What are my highest risk contracts?"        │ → risk-analysis
   ├────────────────────────────────────────────────┤
   │ 🔍 "Which contracts expire in the next 90 days?"│ → timeline
   ├────────────────────────────────────────────────┤
   │ 🔍 "Compare payment terms across my contracts"  │ → comparison
   ├────────────────────────────────────────────────┤
   │ 🔍 "Show me all unlimited liability clauses"    │ → clause-type
   └────────────────────────────────────────────────┘
```

Same visual treatment as `SuggestedSearches.tsx` (Georgia italic quotes,
magnifier icon, border rows) — implement once, reuse the component.

---

## Component → Renderer Map (for implementation)

```
apps/frontend/src/components/features/portfolio-chat/blocks/
├── RiskRankingBlock.tsx          format: 'ranked-list'
├── ComparisonTableBlock.tsx      format: 'comparison'
├── TimelineBlock.tsx             format: 'timeline'
├── ClauseListBlock.tsx           format: 'clause-list'  (wraps existing ClauseCard)
├── FinancialSummaryBlock.tsx     format: 'financial'
├── DocSummaryBlock.tsx           format: 'doc-summary'
└── ProseBlock.tsx                format: 'prose'        (fallback)

ChatMessage.tsx picks the block:
  const Block = BLOCK_BY_FORMAT[message.metadata.format] ?? ProseBlock;
  return <Block data={message.metadata.structuredData} citations={...} />;
```

### Reuse from existing code (don't rebuild)
- `SimilarityBar` → financial mini-bars
- `ClauseCard` / `PrecedentRow` → ClauseListBlock rows
- `Badge` → severity badges everywhere
- `TypePill` → contract type chips
- `SuggestedSearches` pattern → first-run suggestions
- Severity palette + 4px stripe → RiskRankingBlock

---

## Open Questions for Design Review

1. **Drawer vs full page** — comparison tables and financial bars are tight at
   480px. Recommend: drawer for quick Q&A, full `/chat` page for the rich blocks.
2. **Mixed-type answers** — "highest risk contracts expiring soon" is risk + timeline.
   Phase 2: pick the dominant type. Phase 4: allow composite blocks.
3. **Are the ▲/▼ favorability markers in comparison too opinionated?** They assume
   "you" are the buyer. Confirm with legal before shipping.
