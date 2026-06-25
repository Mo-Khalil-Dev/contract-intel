/**
 * AgentCore Memory — usage example (standalone, runnable).
 *
 * Strands TS has no native Memory wrapper, so you call the AWS data-plane SDK
 * directly (@aws-sdk/client-bedrock-agentcore — already a dependency). This
 * script shows the three operations an agent uses:
 *
 *   1. CreateEvent           — write a turn/fact   (short-term, immediate)
 *   2. ListEvents            — read raw events     (short-term, immediate)
 *   3. RetrieveMemoryRecords — semantic recall     (long-term, async-extracted)
 *
 * The "recall → review → remember" loop in a real agent is just #3 before the
 * review (inject precedent into the prompt) and #1 after (store the verdict).
 *
 * ── Run it ───────────────────────────────────────────────────────────────
 *   # one-time: create a memory with a semantic strategy, note the id
 *   aws bedrock-agentcore-control create-memory \
 *     --name contract_review_memory --event-expiry-duration 90 \
 *     --memory-strategies '[{"semanticMemoryStrategy":{"name":"clauseDecisions"}}]' \
 *     --region eu-west-2 --query 'memory.id' --output text
 *
 *   # wait until ACTIVE:
 *   aws bedrock-agentcore-control get-memory --memory-id <ID> --region eu-west-2 \
 *     --query 'memory.status'
 *
 *   # then run:
 *   AWS_PROFILE=agentcore AWS_REGION=eu-west-2 MEMORY_ID=<ID> npx tsx memory-example.ts
 */
import {
  BedrockAgentCoreClient,
  CreateEventCommand,
  ListEventsCommand,
  RetrieveMemoryRecordsCommand,
} from '@aws-sdk/client-bedrock-agentcore';

const REGION = process.env.AWS_REGION ?? 'eu-west-2';
const MEMORY_ID = process.env.MEMORY_ID;
if (!MEMORY_ID) throw new Error('Set MEMORY_ID (see header for create-memory).');

const client = new BedrockAgentCoreClient({ region: REGION });

// Who/where the memory is scoped to. actorId groups an "owner" (e.g. the org or
// agent); sessionId groups one interaction (here: one contract).
const ACTOR_ID = 'contract-review-agent';
const SESSION_ID = 'demo-contract-85e11760';

// ── 1. WRITE — store an event (a decision the agent reached) ──────────────
async function write() {
  const res = await client.send(
    new CreateEventCommand({
      memoryId: MEMORY_ID,
      actorId: ACTOR_ID,
      sessionId: SESSION_ID,
      eventTimestamp: new Date(),
      // payload is a union: { conversational: {role, content} } | { blob }
      payload: [
        {
          conversational: {
            role: 'ASSISTANT',
            content: {
              text:
                'Decision: rejected uncapped liability (LIA-01) and MFN pricing ' +
                '(COM-02) for counterparty Apex Global Holdings; rated Critical, ' +
                'escalated to GC. Governing law (Russian Federation) is a hard stop.',
            },
          },
        },
      ],
    }),
  );
  console.log('✅ CreateEvent →', res.event?.eventId);
}

// ── 2. READ (short-term) — raw events for this session, available now ─────
async function listRecent() {
  const res = await client.send(
    new ListEventsCommand({
      memoryId: MEMORY_ID,
      actorId: ACTOR_ID,
      sessionId: SESSION_ID,
      maxResults: 5,
    }),
  );
  console.log(`✅ ListEvents → ${res.events?.length ?? 0} event(s) this session`);
}

// ── 3. READ (long-term) — semantic recall over EXTRACTED records ──────────
// NOTE: extraction runs asynchronously after CreateEvent, so right after a
// write this may be empty. It fills in minutes later (or across sessions).
async function recall(query: string) {
  const res = await client.send(
    new RetrieveMemoryRecordsCommand({
      memoryId: MEMORY_ID,
      namespace: 'clauseDecisions',
      searchCriteria: { searchQuery: query, topK: 5 },
    }),
  );
  const hits = res.memoryRecordSummaries ?? [];
  console.log(`✅ RetrieveMemoryRecords("${query}") → ${hits.length} record(s)`);
  for (const r of hits) console.log('   •', r.content?.text?.slice(0, 120));
}

async function main() {
  await write();
  await listRecent();
  await recall('liability cap and MFN pricing decisions for counterparty paper');
  console.log(
    '\n(If recall returned 0, that is expected immediately after a write — ' +
      'long-term extraction is async. Re-run in a few minutes.)',
  );
}

main().catch((e) => {
  console.error('memory example failed:', e);
  process.exit(1);
});
