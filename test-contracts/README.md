# Test contracts

Synthetic contract PDFs for manually testing the Phase 8 clause-extraction
pipeline end-to-end. The script is deterministic; outputs are not checked
into git (they live in `output/`).

## Generate

From the repo root:

```bash
cd apps/backend
TS_NODE_PROJECT=tsconfig.json npx ts-node --transpile-only ../../test-contracts/generate-test-contracts.ts
```

Output: 5 PDFs in `test-contracts/output/`, each ~2–5 KB.

## The portfolio

| File                          | Risk profile                                                                                                       | What it exercises                                                                 |
|-------------------------------|--------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| `saas-vendor-balanced.pdf`    | **Low / medium** — standard market terms                                                                           | Indemnification (mutual), capped liability, 30-day cure termination, GDPR        |
| `saas-vendor-risky.pdf`       | **Critical** — aggressive vendor-friendly                                                                          | One-sided unlimited indemnification, uncapped liability, 5-day unilateral termination, 5-year worldwide non-compete, 15% annual escalation |
| `nda-mutual.pdf`              | **Low** — short, balanced                                                                                          | Confidentiality, term, return-of-materials, governing law                         |
| `msa-services.pdf`            | **Mixed** — 12 clauses                                                                                              | Payment terms (CPI+1%), IP work-for-hire, mutual indemnification, force majeure, dispute escalation ladder |
| `employment-senior.pdf`       | **Medium / high** — executive employment                                                                            | IP assignment, 24-month multi-region non-compete, perpetual confidentiality, change-of-control severance |

## Manual smoke flow

With the local stack running and migrations applied:

1. Open <http://localhost:5173>
2. Sign in
3. Upload one of the PDFs from `test-contracts/output/`
4. Watch the 6-step processing screen roll through
5. Land on `/results/:id` — verify:
   - **Overview tab**: parties, key dates, financial terms populated; risk score reflects the contract's profile
   - **Risk Flags tab**: count + accordion entries match expectations
   - **Document tab**: critical / high clauses highlighted in red / amber

`saas-vendor-risky.pdf` is the loudest end-to-end demo — expect 4–5
critical/high flags and a deep-red Risk Assessment card.
`saas-vendor-balanced.pdf` is the quietest — most clauses land on
medium or low.

## Running with real Claude vs mock

The mock clause-extractor only matches on the keywords
`Indemnification`, `Limitation of Liability`, `Termination`,
`material breach`, and `Payment`. It returns the same 5 clauses + fixed
metadata regardless of which contract is uploaded — useful for proving
the pipeline plumbing.

For real classification + risk scoring (and contract-specific metadata),
flip the env to Anthropic:

```bash
# In apps/backend/.env
CLAUSE_EXTRACTOR=anthropic
CLAUDE_API_KEY=sk-ant-...
```

…then restart the backend. Cost is ~$0.10–0.20 per contract on Opus 4.7.
