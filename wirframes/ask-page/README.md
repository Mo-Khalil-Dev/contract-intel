# Ask Page — Interactive Prototype

A self-contained HTML prototype of the Portfolio AI **"Ask" page**: a single
question box with answer cards stacked underneath. No build step — open
`ask-page.html` in any browser.

## What it demonstrates

- **Hero + ask box** with time-aware greeting and gradient "Ask" button
- **First-run suggestions** — one per query type, click to run
- **6 answer-card types**, each rendering a different result block:

| Question | Type | Result block |
|---|---|---|
| "What are my highest risk contracts?" | risk | Ranked table + score chips + risk badges |
| "Which contracts expire in the next 90 days?" | timeline | Vertical timeline by urgency + notice deadlines |
| "Compare payment terms across my contracts" | comparison | Table with ▲/▼ favorability markers |
| "Show me all unlimited liability clauses" | clause | Clause cards (Georgia italic snippets) |
| "What's my total payment obligation?" | financial | Hero total + share-of-total bars |
| "Summarize the SaaS Vendor agreement" | document | Metadata fact-sheet + top risks |

## How to drive it

1. Open `ask-page.html`.
2. Click a suggested question, **or** type one and press Enter / click **Ask**.
   A naive client-side classifier picks the card type (mirrors the backend
   `QueryClassifierService`).
3. Cards stack newest-on-top. Use the `✕` action to dismiss a card.
4. `⌘K` / `Ctrl+K` focuses the ask box (page-scoped).

## Notes for the developer

- This is a **design reference**, not production code. Recreate in React using
  the component structure in `WIREFRAMES_ASK_PAGE.md`.
- Colors/typography use the ContractIntel tokens (DM Sans / DM Mono / Georgia).
  In production these come from the existing token system.
- All data is hard-coded mock. Wire to the real chat endpoint; keep the
  per-type block shapes.
- The result table is column-agnostic by design — each block picks its columns
  from `structuredData` (risk shows Risk, financial shows Value, etc.).

See `../../WIREFRAMES_ASK_PAGE.md` and `../../WIREFRAMES_CHAT_RESPONSE_TYPES.md`
for the full specs.
