# Negotiation Suite — Design Brief

**Audience:** Claude Design (or any designer picking this up cold)
**Status:** Wireframe / IA stage. No visual design yet.
**Goal:** Help in-house counsel and deal teams negotiate contracts faster and more consistently by surfacing portfolio precedent, deviation signals, and pre-approved fallback language at the moment of review.

---

## 1. Product context

Contract Intel ingests contracts, extracts clauses, embeds them, and scores risk. Two new feature areas build on that:

- **Clause Intelligence** — leverages embeddings across the portfolio (search, outlier detection, clustering).
- **Playbook** — codifies the organisation's negotiation standards (ideal / acceptable / fallback / red-line language per clause type).

These two features converge on a single surface: the **Negotiation Review** screen, where a user works through a counterparty's contract or redline.

---

## 2. Primary user & job-to-be-done

**User:** In-house counsel, contracts manager, or deal lead reviewing an incoming contract or counterparty redline.

**JTBD:** *"When I'm reviewing this contract, help me decide — clause by clause — what to accept, push back on, and exactly what counter-language to send back."*

**Key questions the UI must answer per clause:**
1. Is this term unusual for us? (outlier vs portfolio)
2. What's our standard position? (playbook)
3. What have we accepted before in similar deals? (precedent)
4. What should I send back? (suggested counter)

---

## 3. Information architecture

```
Contracts
  └─ Contract detail
      ├─ Overview        (existing)
      ├─ Clauses         (existing — extend)
      ├─ Risk            (existing)
      └─ Negotiation     (NEW — primary surface for this brief)

Clause Library            (NEW — cross-contract)
  ├─ Search
  ├─ Outliers
  └─ Clusters / Insights

Playbook                  (NEW)
  ├─ Clause Standards     (list of clause types with tiered language)
  ├─ Editor               (edit a single standard)
  └─ Coverage Report      (which standards exist, gaps, last-reviewed)
```

---

## 4. Core screens to design

### 4.1 Negotiation Review (most important — design first)

A two-pane layout:

- **Left pane (60%):** the contract, scrollable, with clauses highlighted by status: `aligned` (green tick), `deviation` (amber), `red-line` (red), `unreviewed` (grey).
- **Right pane (40%):** the **Negotiation Card** for the currently-focused clause.

**Negotiation Card components (the atomic unit of this whole feature):**

1. **Header**
   - Clause type (e.g. "Limitation of Liability")
   - Status chip: Aligned / Deviation / Red-line / Unreviewed
   - Deviation score (0–100) with a small bar
2. **Their language** — the counterparty's text, with diff highlights if this is a redline against a prior version
3. **Playbook position** — collapsible block showing:
   - Ideal language (what we'd love)
   - Acceptable range (what we'll take)
   - Red lines (what we won't take)
4. **Portfolio precedent** — "You've signed 23 similar clauses. Accepted 18, pushed back 5." With a "View precedents" affordance opening a side drawer of the top 5 most-similar accepted clauses, each with counterparty, deal size, date.
5. **Suggested counter** — pre-filled redline text. Two sources:
   - From playbook (preferred if there's a matching standard)
   - From closest accepted precedent (if no playbook match)
   - "Regenerate" and "Edit" actions
6. **Actions** — Accept · Counter · Flag for escalation · Add note

**States to design:**
- All four status states (aligned / deviation / red-line / unreviewed)
- "No precedent found" empty state
- "No playbook standard exists" empty state with CTA to add one
- Loading / generating-counter state

### 4.2 Contract overview header — Negotiation summary strip

When a contract has been analysed, the contract detail page should gain a strip showing: `12 aligned · 4 deviations · 1 red-line · 3 unreviewed`. Click drills into Negotiation Review filtered.

### 4.3 Clause Library — Search

- Search bar: free text OR "find clauses like this one" (paste a clause)
- Filters: clause type, counterparty, date range, deal size, status (accepted/rejected)
- Results: ranked by semantic similarity, each row shows snippet, contract, counterparty, similarity score
- Row click → side drawer with full clause + parent contract link

### 4.4 Clause Library — Outliers

- Grouped by clause type
- Each row: clause snippet · which contract · outlier score · "why this is unusual" (e.g. "liability cap 10× lower than your portfolio median")
- Bulk actions: mark reviewed, escalate

### 4.5 Playbook — Standards List

- Table of clause types: Name · Tier coverage (ideal/acceptable/fallback/red-line filled or not) · Last reviewed · Owner · # contracts using this standard
- Empty rows for clause types seen in portfolio but missing a standard (gap discovery)

### 4.6 Playbook — Standard Editor

Editing one clause-type standard. Four stacked rich-text blocks (Ideal · Acceptable · Fallback · Red-line) with side notes for *rationale* and *when to apply*. A right-side preview showing how this standard would have scored the last 10 instances of this clause in the portfolio (validation loop).

---

## 5. Visual / interaction direction

- Continue the **v2 from-scratch component style** already in use (no Shadcn dependency).
- Density-first: legal users review many clauses; favour compact cards, tabular lists, keyboard nav (J/K to move between clauses, A to accept, C to counter).
- Status colour system: green (aligned), amber (deviation), red (red-line), grey (unreviewed). Use these consistently across the strip, list, and card.
- Deviation score visualised as a 0–100 bar, not a traffic light alone — users need magnitude, not just category.

---

## 6. Out of scope for this brief

- E-signature integration
- Counterparty-facing comments / collaboration
- Mobile layouts (desktop-first)
- Bulk contract import UX (separate flow)

---

## 7. Deliverables requested

1. Wireframes (lo-fi is fine) for screens 4.1, 4.3, 4.4, 4.5, 4.6
2. A polished comp of the **Negotiation Card** in all four states
3. Interaction notes for keyboard nav and the precedent drawer
4. A small component inventory (status chip, deviation bar, tiered-language block, precedent row)
