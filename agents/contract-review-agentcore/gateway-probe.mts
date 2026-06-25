/**
 * Test the Contract Intel MCP *through* an AgentCore Gateway.
 *
 * The Gateway exposes MCP over Streamable HTTP but requires an inbound bearer
 * token (from the authorizer you configured — Auth0 / Cognito). This probe:
 *   1. connects to the Gateway MCP URL with the token,
 *   2. lists the tools the Gateway brokers,
 *   3. calls get_document_clauses to prove an end-to-end round-trip.
 *
 * Run:
 *   GATEWAY_MCP_URL=<gatewayUrl> GATEWAY_TOKEN=<access_token> \
 *     npx tsx gateway-probe.mts [documentId]
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const URL_ = process.env.GATEWAY_MCP_URL;
const TOKEN = process.env.GATEWAY_TOKEN;
const DOC = process.argv[2] ?? '85e11760-ce6f-4dad-a383-42d9e12f6249';
if (!URL_ || !TOKEN) throw new Error('Set GATEWAY_MCP_URL and GATEWAY_TOKEN.');

const transport = new StreamableHTTPClientTransport(new URL(URL_), {
  requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } },
});
const client = new Client({ name: 'gateway-probe', version: '1.0.0' });

await client.connect(transport);
console.log('✅ connected to Gateway');

const { tools } = await client.listTools();
console.log(`✅ tools (${tools.length}):`, tools.map((t) => t.name).join(', '));

// Gateway often namespaces tools as "<targetName>___<toolName>". Find ours.
const clausesTool =
  tools.find((t) => t.name.endsWith('get_document_clauses'))?.name ??
  'get_document_clauses';

const res = await client.callTool({
  name: clausesTool,
  arguments: { documentId: DOC },
});
const text =
  Array.isArray(res.content) && res.content[0]?.type === 'text'
    ? res.content[0].text
    : JSON.stringify(res.content);
console.log(`✅ ${clausesTool}(${DOC}) →`, String(text).slice(0, 300));

await client.close();
