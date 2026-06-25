/**
 * Playbook-Driven Contract Review agent — AWS Bedrock AgentCore runtime (Track B).
 * Strands Agents TypeScript SDK.
 *
 * The architectural through-line: a DIFFERENT runtime from the Anthropic Managed
 * Agent (Track A), but the same two ingredients underneath —
 *   - same tool layer: the live MCP server (get_document_clauses / get_clause /
 *     find_similar_clauses), reached directly over Streamable HTTP;
 *   - same knowledge: the Company Legal Playbook as the system prompt
 *     (system_prompt.md, identical to the canonical docs/ copy).
 * Only the model (Claude via Amazon Bedrock) and the host (AgentCore) differ.
 * "One tool layer, two runtimes; MCP is the portable interface."
 *
 * AgentCore Runtime contract: this container serves HTTP on :8080 with
 *   POST /invocations  — body = the invocation payload ({ documentId })
 *   GET  /ping         — health check
 * We implement that contract with a thin Express server.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Agent, McpClient } from '@strands-agents/sdk';
import { BedrockModel } from '@strands-agents/sdk/models/bedrock';

// ── Config (set as env vars on the AgentCore runtime at launch) ──────────
// The MCP server is authless and public, so we just need its URL — McpClient
// builds the Streamable-HTTP transport itself. No bearer token.
const MCP_SERVER_URL =
  process.env.MCP_SERVER_URL ??
  'https://backend-production-b0d6.up.railway.app/mcp';
const AWS_REGION = process.env.AWS_REGION ?? 'us-east-1';
const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID ??
  // Newest Claude with model access in your region. Strands accepts Bedrock
  // ids / cross-region inference profiles (e.g. global.* / us.* prefixes).
  'global.anthropic.claude-sonnet-4-6';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(join(__dirname, 'system_prompt.md'), 'utf8');

/** Run the review for one document and return the §4 markdown report. */
async function review(documentId: string): Promise<string> {
  // Authless public MCP server — pass the URL; the client builds the transport.
  const mcp = new McpClient({ url: MCP_SERVER_URL });
  await mcp.connect();
  try {
    const tools = await mcp.listTools();
    const agent = new Agent({
      model: new BedrockModel({ modelId: BEDROCK_MODEL_ID, region: AWS_REGION }),
      systemPrompt: SYSTEM_PROMPT,
      tools,
    });
    const result = await agent.invoke(
      `Review document ${documentId} against the Company Legal Playbook and ` +
        `produce the risk report.`,
    );
    return result.toString().trim();
  } finally {
    await mcp.disconnect();
  }
}

// ── AgentCore Runtime HTTP contract ──────────────────────────────────────
const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/ping', (_req, res) => {
  res.json({ status: 'Healthy' });
});

app.post('/invocations', async (req, res) => {
  const documentId = req.body?.documentId;
  if (!documentId) {
    res.status(400).json({ error: 'documentId is required' });
    return;
  }
  try {
    const markdown = await review(documentId);
    if (!markdown) {
      res.status(500).json({ error: 'agent produced no report text' });
      return;
    }
    res.json({ markdown, runtime: 'agentcore' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`review failed doc=${documentId}: ${message}`);
    res.status(500).json({ error: message });
  }
});

const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`contract-review-agentcore listening on :${PORT}`);
});
