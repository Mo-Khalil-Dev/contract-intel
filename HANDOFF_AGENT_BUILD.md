# Handoff — Build the Playbook-Driven Contract Review Agent

> Companion design doc (read first, it's the full spec): `docs/handoff-contract-review-agent.md`
> Ruleset / agent spec: `docs/legal-playbook.md` · Output rubric: `docs/sample-risk-report.md`

## Goal
An AI agent reads an **already-analyzed** contract, checks it against the
**Legal Playbook**, and writes a **risk report** matching `sample-risk-report.md`.
It READS analysis via MCP; it never re-analyzes. Interview demo — bar is
"works every time + explain every layer."

## What's already DONE (this session)
- **MCP server: built + LIVE in production.** `POST /mcp` (Streamable HTTP),
  3 tools wrapping existing CQRS queries 1:1:
  `get_document_clauses`, `get_clause`, `find_similar_clauses`.
  - URL: `https://backend-production-b0d6.up.railway.app/mcp`
  - Verified: `GET /mcp` → 405, `initialize`/`tools/list` work, **no auth**
    (bearer is optional via `MCP_BEARER_TOKEN`, currently unset = open).
  - Code: `apps/backend/src/modules/mcp/` (`@Public()` on the controller so the
    global SessionAuthGuard doesn't block it).
- **Real analysis pipeline enabled in prod**: `OCR_DRIVER=google-document-ai`,
  `CLAUSE_EXTRACTOR=anthropic`, `EMBEDDING_DRIVER=voyage`.

## ⛔ BLOCKER before the agent reads real data
- **`CLAUDE_API_KEY` in Railway is a PLACEHOLDER** (24 chars, prefix `placeho`)
  → Anthropic returns 401, so clause extraction currently fails ("unauthorized").
  **Action: set a real `sk-ant-…` key** (freshly created — an earlier key
  leaked into a chat) in Railway backend Variables. Then real analysis works.
- Until then the stored analysis is mock/empty, so the agent has nothing real
  to review. (You can still build/test the agent against the MCP server with
  whatever data exists.)
- Worth checking `VOYAGE_API_KEY` isn't also a placeholder (same way).

## Build plan (Track A first)
1. **Anthropic Managed Agent (CMA)** — load the `claude-api` skill FIRST; don't
   write agent code from memory.
   - Agent created ONCE: system prompt = `legal-playbook.md` + its 8-step
     algorithm; tools = the MCP server (`mcp_servers` + `mcp_toolset`) + a write
     tool for the report.
   - Session per run: `sessions.create` → `user.define_outcome` (rubric =
     `sample-risk-report.md` schema) → stream → `files.list({scope_id})` to
     fetch the report from `/mnt/session/outputs/`.
2. **Kickoff**: build `POST /documents/:id/review` (best for live demo); keep a
   CLI script as backup.
3. **Flex upgrades** once #1 works: promote playbook → Skill; add `docx` Skill
   for a Word report.
4. **Track B (AWS Bedrock AgentCore)** — second sprint, same MCP URL underneath.

## Key facts for the build
- Agent uses model `claude-opus-4-8` (newest); leave the extraction pipeline's
  pinned model alone.
- **Data gap**: clause `sectionRef` (e.g. "4.1") is NOT stored — agent DERIVES
  it from verbatim clause `text`, falls back to `pageNumber` + clause id. Don't
  change the schema (would force re-extraction).
- Pre-computed `risk.flags` (e.g. `uncapped_liability`) accelerate rule matching
  (→ LIA-01), then confirm against text.
- Expose `/mcp` to the agent runtime: it's already public on Railway, OR tunnel
  (ngrok) / self-host if keeping contract text in-perimeter (data-residency
  decision — UNDECIDED).
- Architecture soundbite: "playbook = versioned policy/Skill; contract data =
  live via MCP; managed runtime runs the loop; I own the tool layer."

## Deploy mechanics (learned this session — important)
- **Deploys are MANUAL**: `railway up --service backend --detach` (and
  `--service frontend`). NOT auto-on-push. CLI must be logged in (`railway login`).
- Backend build runs `prisma migrate deploy` automatically.
- **Gotcha fixed**: gaxios/node-fetch on Node 22 broke GCS uploads
  (`ERR_STREAM_PREMATURE_CLOSE`) — patched in `main.ts` via
  `shared/infrastructure/http/gaxios-native-fetch.patch.ts` (forces native
  fetch). Don't remove it.
- Frontend build is `tsc && vite build` — keep tsc clean or the deploy fails.
- `ERR_INTERNET_DISCONNECTED` in browser = stale QUIC/socket from redeploys
  (client-side), not a server outage. Flush sockets / new browser.
- Incognito login fails because frontend+backend are cross-site subdomains on
  `up.railway.app` (PSL) → session cookie is `SameSite=None` 3rd-party →
  blocked in incognito. Real fix: custom domains (`app.x.com` + `api.x.com`).

## Loose ends (not blocking the agent)
- Rotate the leaked `CLAUDE_API_KEY` and set the real one (also the BLOCKER above).
- PostHog still in the frontend bundle (delete `VITE_POSTHOG_KEY` to silence).
- Duplicate contract row in portfolio data (projection/dedupe — investigate).

## Repo / branch
- Branch `Development` (default). Latest backend commit `4f4a37c` (gaxios fix).
- Repo `Mo-Khalil-Dev/contract-intel`. Commit only when asked.
