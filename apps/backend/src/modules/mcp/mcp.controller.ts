import {
  All,
  Controller,
  Logger,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { Public } from '../auth/infrastructure/decorators/public.decorator';
import { McpBearerGuard } from './mcp-bearer.guard';
import { createContractReviewMcpServer } from './contract-review-mcp-server';

/**
 * HTTP boundary for the Contract-Review MCP server (Phase 12, step 1).
 *
 * Exposes the MCP tool layer over **Streamable HTTP** (the URL transport)
 * at `POST /mcp`, which is the transport BOTH agent runtimes can reach —
 * Anthropic Managed Agents and AWS Bedrock AgentCore — making this the one
 * portable interface underneath two runtimes.
 *
 * **Stateless** by design: each request gets a fresh `McpServer` +
 * transport (`sessionIdGenerator: undefined`), wired to the shared
 * QueryBus, then torn down when the response closes. No session store, no
 * cross-request state — the simplest correct shape for a demo and trivially
 * horizontally scalable. GET/DELETE (used for server-initiated SSE streams
 * in stateful mode) return 405 since we hold no session.
 *
 * Mounted at `/mcp` (excluded from the global `api/v1` prefix in main.ts)
 * so the MCP URL is clean for the runtime/vault config and tunnel.
 */
// @Public() exempts the controller from the global SessionAuthGuard (Auth0
// session cookie) — the MCP caller is a machine runtime, not a logged-in
// user. McpBearerGuard is the trust boundary instead (static bearer token).
@Public()
@ApiExcludeController()
@UseGuards(McpBearerGuard)
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly queryBus: QueryBus) {}

  @All()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    // Stateless GET/DELETE have no session to act on under streamable HTTP.
    if (req.method === 'GET' || req.method === 'DELETE') {
      res.status(405).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed (stateless server).' },
        id: null,
      });
      return;
    }

    const server = createContractReviewMcpServer(this.queryBus);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`MCP request handling failed: ${message}`);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  }
}
