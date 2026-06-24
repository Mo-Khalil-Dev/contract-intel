export const CONTRACT_REVIEW_RUNNER = Symbol('CONTRACT_REVIEW_RUNNER');

/**
 * Outbound port to the Playbook-Driven Contract Review agent.
 *
 * The agent reads an already-analysed contract through the MCP server
 * (get_document_clauses / get_clause / find_similar_clauses), grades it
 * against the Company Legal Playbook (its system prompt), and returns a
 * §4 risk report as markdown.
 *
 * Two adapters implement this port; the active one is chosen at boot by
 * the factory in DocumentsModule based on AppConfigService.contractReviewRuntime
 * (env var CONTRACT_REVIEW_RUNTIME):
 *   - 'anthropic' → AnthropicManagedAgentRunner (Track A — live)
 *   - 'agentcore' → AgentCoreRunner (Track B — AWS Bedrock AgentCore)
 *
 * The MCP server and the playbook are identical across both runtimes —
 * MCP is the portable tool layer; only the runtime that drives the loop
 * differs. Callers (the RunContractReview handler) never learn which ran.
 */
export interface IContractReviewRunner {
  review(input: ContractReviewInput): Promise<ContractReviewResult>;
}

export interface ContractReviewInput {
  /** The document the agent should review. Passed to the agent verbatim;
   *  the agent fetches the clauses itself via the MCP tools. */
  documentId: string;
}

export interface ContractReviewResult {
  /** The §4 risk report, markdown. */
  markdown: string;
  /** Which runtime produced it — persisted alongside the report so the
   *  two tracks can be compared, and surfaced in the UI. */
  runtime: ContractReviewRuntime;
  /** Runtime-native run id (CMA session id / AgentCore invocation id) for
   *  trace + debugging. Optional. */
  runId?: string;
}

export type ContractReviewRuntime = 'anthropic' | 'agentcore';
