import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { GetClausesForDocumentQuery } from '../clauses/application/queries/get-clauses-for-document.query';
import { GetClauseByIdQuery } from '../clauses/application/queries/get-clause-by-id.query';
import { GetSimilarClausesQuery } from '../clauses/application/queries/get-similar-clauses.query';
import type { ClauseDto } from '../clauses/application/queries/clause.dto';
import type { SimilarClausesResponse } from '../clauses/application/queries/similar-clauses.dto';

/**
 * The Contract-Review MCP server (Phase 12, build-order step 1).
 *
 * This is the single tool layer shared by BOTH agent runtimes — Anthropic
 * Managed Agents (Track A) and AWS Bedrock AgentCore (Track B). It exposes
 * the *already-ingested* contract analysis as MCP tools so the playbook
 * agent can READ a contract's clauses (with their pre-computed risk fields)
 * and pull precedent from the rest of the portfolio. The agent does NOT
 * re-analyse — extraction happens at write-time in the ingestion pipeline;
 * these tools are the read-time door (see docs/handoff-contract-review-agent.md).
 *
 * Each tool wraps an existing CQRS query handler 1:1 — no new business
 * logic lives here. The tool layer is a thin, typed, audited surface over
 * the QueryBus; correctness and org/format validation stay in the handlers
 * (e.g. `ClauseId.fromString` throws → surfaced here as an MCP error).
 *
 * Tools deliberately return the FULL stored DTO as JSON (risk score/flags/
 * explanation, pageNumber, verbatim text) — the playbook agent matches
 * pre-computed `risk.flags` to rule IDs (e.g. `uncapped_liability` → LIA-01),
 * derives the clause section ref from the verbatim text (sectionRef is not
 * a stored field yet), and cites both.
 *
 * Stateless: a fresh server instance is created per HTTP request by the
 * controller, so there is no cross-request state to leak.
 */
export function createContractReviewMcpServer(queryBus: QueryBus): McpServer {
  const logger = new Logger('ContractReviewMcp');

  const server = new McpServer(
    {
      name: 'contract-review',
      version: '0.1.0',
    },
    {
      instructions:
        'Read-time access to already-ingested contract analysis for the ' +
        'Playbook-Driven Contract Review agent. Use get_document_clauses to ' +
        'pull every clause of a contract (each carries pre-computed risk ' +
        'fields and the verbatim text from which the section reference can be ' +
        'derived), get_clause to inspect one clause, and find_similar_clauses ' +
        'to pull precedent for a clause from the rest of the portfolio. These ' +
        'tools never re-analyse — they return the stored extraction.',
    },
  );

  /**
   * Generic-erased wrapper around `server.registerTool`. The SDK's
   * `registerTool` infers the handler's argument type from the zod raw
   * shape, which trips TS2589 ("type instantiation is excessively deep")
   * under this project's compiler settings. Erasing the generic here keeps
   * the call site clean; runtime zod validation against `inputSchema` is
   * unaffected (the SDK still parses args before invoking the handler), and
   * each handler re-narrows its args explicitly.
   */
  type ToolResult = {
    isError?: boolean;
    content: Array<{ type: 'text'; text: string }>;
  };
  const register = (
    name: string,
    config: unknown,
    handler: (args: Record<string, unknown>) => Promise<ToolResult>,
  ): void => {
    (
      server.registerTool as unknown as (
        n: string,
        c: unknown,
        h: (args: Record<string, unknown>) => Promise<ToolResult>,
      ) => void
    )(name, config, handler);
  };

  /** Serialise a successful tool result as a single JSON text block. */
  const ok = (payload: unknown): ToolResult => ({
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  });

  /**
   * Map a thrown handler/domain error to an MCP tool error. We return
   * `isError: true` (rather than throwing) so the model sees the message
   * and can recover — e.g. a malformed UUID or an unknown clause id.
   */
  const fail = (toolName: string, error: unknown): ToolResult => {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`${toolName} failed: ${message}`);
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Error: ${message}` }],
    };
  };

  register(
    'get_document_clauses',
    {
      title: 'Get all clauses for a contract',
      description:
        'Return every extracted clause for a contract (document), in document ' +
        'order. Each clause includes its verbatim text, type, confidence, ' +
        'page number, and pre-computed risk fields (score, level, flags, ' +
        'explanation). This is the agent’s entry point for a playbook ' +
        'review: pull all clauses, then match each against the playbook rules. ' +
        'The section reference (e.g. "4.1") is not a stored field — derive ' +
        'it from the start of the verbatim text, falling back to pageNumber + id.',
      inputSchema: {
        documentId: z
          .string()
          .describe('The contract (document) UUID to fetch clauses for.'),
      },
    },
    async (args) => {
      const documentId = String(args.documentId);
      try {
        const clauses = await queryBus.execute<
          GetClausesForDocumentQuery,
          ClauseDto[]
        >(new GetClausesForDocumentQuery(documentId));
        return ok({ documentId, count: clauses.length, clauses });
      } catch (error) {
        return fail('get_document_clauses', error);
      }
    },
  );

  register(
    'get_clause',
    {
      title: 'Get a single clause by id',
      description:
        'Return one clause by its UUID, with full verbatim text, type, ' +
        'confidence, page number, and pre-computed risk fields. Use after ' +
        'find_similar_clauses to inspect a precedent in full, or to re-read a ' +
        'specific clause while drafting a finding.',
      inputSchema: {
        clauseId: z.string().describe('The clause UUID to fetch.'),
      },
    },
    async (args) => {
      const clauseId = String(args.clauseId);
      try {
        const clause = await queryBus.execute<GetClauseByIdQuery, ClauseDto>(
          new GetClauseByIdQuery(clauseId),
        );
        return ok(clause);
      } catch (error) {
        return fail('get_clause', error);
      }
    },
  );

  register(
    'find_similar_clauses',
    {
      title: 'Find similar clauses across the portfolio',
      description:
        'Given a source clause UUID, return the most semantically similar ' +
        'clauses from the rest of the portfolio (same type, different ' +
        'documents), ranked by cosine similarity. Backed by real Voyage ' +
        'embeddings. Use this to ground a finding in precedent — e.g. how ' +
        'this counterparty’s liability cap compares to standard paper.',
      inputSchema: {
        clauseId: z
          .string()
          .describe('The source clause UUID to find precedent for.'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe('Maximum number of matches to return (default 5).'),
      },
    },
    async (args) => {
      const clauseId = String(args.clauseId);
      const limit = typeof args.limit === 'number' ? args.limit : 5;
      try {
        const result = await queryBus.execute<
          GetSimilarClausesQuery,
          SimilarClausesResponse
        >(new GetSimilarClausesQuery(clauseId, limit));
        return ok(result);
      } catch (error) {
        return fail('find_similar_clauses', error);
      }
    },
  );

  return server;
}
