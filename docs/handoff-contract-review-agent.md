# Handoff — Interview Demo: Playbook-Driven Contract Review Agent (MCP + Managed Agents)

## Goal (the ONLY goal)
Build a small, reliable, **demoable** AI-agent feature on the existing
`contract-intel-v2` app for a **job interview next week**. Bar = "works every
time + I can explain every layer," NOT production.

Skills to showcase: (1) building **MCP servers**, (2) AI agents on **AWS
Bedrock AgentCore**, (3) **Anthropic Managed Agents (CMA)**.

> ⚠️ Abandoned scope — IGNORE: an earlier "Contract Negotiation" feature and a
> generic "Risk Memo Generator" were discussed then dropped. The live feature
> is the Playbook-Driven Contract Review below.

## THE FEATURE — Playbook-Driven Contract Review
An agent reviews an already-ingested contract **against the company Legal
Playbook** and produces a **risk report** (risks + severities + recommended
rephrases/additions/amendments, with dual citations to clause ref AND playbook
rule ID).

- **Playbook (the ruleset):** `docs/legal-playbook.md` (v1.0). Already
  decomposed into discrete rules with IDs (LIA-01, IND-01, DP-02 …), a tiering
  rubric (§A), approved templates (§B), positions/fallbacks (§C), mandatory
  clauses (§D), prohibited "hard stop" terms (§E), missing-clause rules (§3),
  and — crucially — the agent algorithm ("How the Agent Should Use This
  Playbook", 8 steps) and the **exact output schema (§4)**. It is effectively
  the agent spec.
- **Target output / quality bar:** `docs/sample-risk-report.md`. THIS IS THE
  OUTCOME RUBRIC. Shows the required sections: Summary (with risk tier +
  approval authority), Hard Stops triggered, Findings table (one row per
  matched rule: Rule ID · Clause · Severity · Risk · Ref · Action),
  Missing-Clause gaps, Prioritised Action List, Approval Routing. Also shows
  sophisticated behaviors the agent must do: COM-02 severity ELEVATED to
  Critical via §E hard-stop override (with footnote); tier = max(value band,
  highest finding severity).

## Architecture (decided)
Clean separation — **playbook = static knowledge, contract = dynamic data,
each enters through a different door:**

```
PLAYBOOK (static, versioned) → agent KNOWLEDGE
   v1: paste into the agent system prompt (simplest, prompt-cached).
   upgrade: promote to an Anthropic Skill (flex; what Skills are for).
CONTRACT (dynamic, per-run)  → agent DATA via the MCP server (your DB)
OUTPUT (the report)          → agent writes §4 report to /mnt/session/outputs/
   v1: markdown.  upgrade: Anthropic `docx` Skill for a Word report (flex).
KICKOFF                       → CMA Outcome (user.define_outcome + rubric =
   sample-risk-report.md), so the harness iterates until the report conforms.
```
This shows THREE MA features in one demo: **MCP + Skills + Outcomes** — rare.
Mental model: **Agent created ONCE → Session per run.**

## Runtimes — BOTH, as SEPARATE tracks (user's words)
- **Track A = Anthropic Managed Agents** (do first; skill docs cover it deeply).
- **Track B = AWS Bedrock AgentCore** (CMA NOT available on Bedrock — AgentCore
  has its own runtime + Claude via Bedrock; genuinely different invocation).
- **ONE shared MCP server underneath both** — the architectural through-line
  and main flex ("one tool layer, two runtimes; MCP is a portable interface").

## Existing app facts (already built — do NOT rebuild)
- Monorepo: `apps/backend` (NestJS, hexagonal ports/adapters, CQRS QueryBus),
  `apps/frontend` (React; user prefers custom components over Shadcn).
- **Ingestion pipeline already analyzes every contract with Claude and stores
  the result.** The agent READS this; it does NOT re-analyze. Two uses of
  Claude: pipeline = write-time, agent = read-time.
- Extraction prompt/schema:
  `apps/backend/src/modules/clauses/infrastructure/extraction/claude-prompt.ts`
  (pins `claude-opus-4-7`; latest is `claude-opus-4-8` — leave pipeline alone,
  use `claude-opus-4-8` for the NEW agent).
- **Clause record fields** (from `clauses/application/queries/clause.dto.ts`):
  `id, documentId, parentClauseId, type, confidence, pageNumber,
  startOffset, endOffset, text (verbatim), hasEmbedding,
  risk{score,flags,explanation}, createdAt`.
  Document `metadata`: contractType, parties[], dates, noticePeriod,
  autoRenewal, payment fields.
- **DATA GAP — clause section refs (e.g. "4.1") are NOT stored.** DTO has
  `pageNumber` + `id`; `sectionRef` is null/"not in schema yet" (see
  `infrastructure/persistence/pgvector-clause-similarity.repository.ts:122`).
  Demo approach: agent DERIVES the section number from the verbatim clause
  `text` (clauses usually start with their number), FALLS BACK to
  `pageNumber` + clause id. Do NOT add sectionRef to the schema for the demo
  (would require re-extraction) — note as future work.
- Pre-computed `risk.flags` (e.g. `uncapped_liability`) ACCELERATE rule
  matching (uncapped_liability → LIA-01) — agent matches flags then confirms
  against clause text.
- **Reusable query handlers the MCP tools wrap 1:1 (no new logic):**
  `clauses/application/queries/` —
  `GetClausesForDocumentQuery` → `get_document_clauses(documentId)`
  `GetSimilarClausesQuery` (LIVE Voyage) → `find_similar_clauses(text)`
  `GetClauseByIdQuery` → `get_clause(clauseId)`
- Semantic search backend is MOCKED (memory phase11) — don't rely on it;
  similar-clauses (Voyage) is real.
- Corpus in DB + vectorized: 10 standard DPAs (commit `7649db8`) — benchmark
  for `find_similar_clauses`.
- HTTP surface: `clauses/infrastructure/clauses.controller.ts`,
  `documents/infrastructure/document.controller.ts`.
- Optional auto-trigger seam: `ClauseExtractionCompletedEvent` in
  `clauses/domain/events/clause.events.ts`.

## Kickoff options (how the review MA starts)
1. **Button / endpoint `POST /documents/:id/review`** (best for live demo).
2. Auto on `ClauseExtractionCompletedEvent` (magical, no live control).
3. CMA scheduled deployment (cron — autonomous flex; mention, don't demo).
4. CLI script (bulletproof backup).
Recommended: build #1, keep #4 as backup, mention #2/#3.

## Build order
1. **MCP server first** — NestJS module injecting the existing QueryBus,
   served over **Streamable HTTP** (URL transport — required so BOTH runtimes
   reach it). `@modelcontextprotocol/sdk`. Tools return the FULL stored record
   (incl. risk fields + metadata + pageNumber). Test with MCP Inspector.
2. Expose via tunnel (ngrok) for the demo (or self-hosted CMA env if keeping
   contract data fully in-perimeter — data-residency decision, UNDECIDED).
3. **Track A (Anthropic MA):** create env + vault (static_bearer for MCP) +
   agent ONCE (system = playbook + algorithm; mcp_servers + mcp_toolset +
   agent_toolset for write). Runtime: sessions.create → user.define_outcome
   (rubric = sample-risk-report.md schema) → stream to terminal →
   files.list({scope_id}) to fetch the report. Wire to POST endpoint.
3b. Promote playbook → Skill and add `docx` Skill (flex) once #3 works.
4. **Track B (AWS AgentCore):** same MCP URL, AgentCore runtime/gateway,
   Claude via Bedrock. Second sprint — keep Track A working first.
5. Polish: pick/seed a contract that triggers many rules (like the sample);
   show the tool-call trace to prove multi-step reasoning.

## Honest framing to carry forward
- Make demos MULTI-STEP and show the tool-call trace; don't oversell
  "agentic" for single lookups — calibrated claims impress more.
- MCP server craftsmanship (schemas, tool descriptions, auth, error handling,
  HTTP transport) is the most concretely-judged skill — invest polish there.
- Good architecture soundbite: "playbook is versioned policy/Skill; contract
  data is live via MCP; the managed runtime runs the loop; I own the tool
  layer."

## Open decisions (not blocking the MCP server)
- Data perimeter: cloud env + `limited` networking allowlist (ngrok) vs.
  self-hosted environment (contract text never leaves infra; more ops).
- Playbook delivery v1: system prompt (simple) vs. Skill (flex) — recommend
  start system-prompt, promote to Skill.
- Report format v1: markdown vs. `docx` Skill — recommend start markdown.

## Suggested skills for the next session
- **`claude-api`** — REQUIRED before writing any CMA/agent code. Authoritative
  for Managed Agents (agents/sessions/environments/vaults/Outcomes/Skills),
  exact `@anthropic-ai/sdk` `client.beta.*` bindings, model IDs
  (`claude-opus-4-8`), and idle-break / stream-first / scope_id pitfalls.
  Do NOT write agent code from memory.
- **`run`** / preview tools — launch backend + MCP Inspector to verify the
  MCP server round-trips.
- **`Plan`** subagent — if the user wants a written implementation plan first.

---
*Companion artifacts (read these first): `docs/legal-playbook.md` (the ruleset
/ agent spec) and `docs/sample-risk-report.md` (the target output / Outcome
rubric).*
