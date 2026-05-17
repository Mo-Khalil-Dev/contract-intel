import { Inject, Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import {
  ExtractInput,
  ExtractedContract,
  IClauseExtractor,
} from '../../application/ports/clause-extractor.port';
import {
  ExtractionPermanentError,
  ExtractionTransientError,
} from '../../application/errors/clause-extraction-errors';
import {
  CHUNK_THRESHOLD_CHARS,
  CLAUDE_SYSTEM_PROMPT,
  EXTRACT_CLAUSES_TOOL,
  MAX_OUTPUT_TOKENS,
} from './claude-prompt';
import { mapClaudeResponseToClauses } from './claude-response.mapper';

export const ANTHROPIC_CLIENT = Symbol('ANTHROPIC_CLIENT');
export const CLAUDE_MODEL = Symbol('CLAUDE_MODEL');

/**
 * Real Claude clause-extractor.
 *
 * Boundary contract identical to MockClauseExtractor: input ExtractInput,
 * output ExtractedClause[]. The handler does NOT change between mock and
 * real driver — that's the whole point of the port.
 *
 * Three things this adapter is responsible for:
 *
 *   1. Transport: one (or N, when chunked) Anthropic Messages calls with
 *      tool-use forced to `extract_clauses`. System prompt + tool schema
 *      are marked `cache_control: { type: 'ephemeral' }` for prompt
 *      caching — every call after the first reads them from cache (~75%
 *      input-token savings on the static prefix).
 *
 *   2. Chunking: above CHUNK_THRESHOLD_CHARS we split by page boundaries
 *      and run the calls in parallel. Each chunk's clauses come back
 *      with chunk-local clientRefs; the handler doesn't care because
 *      offsets are resolved server-side via indexOf into the FULL text.
 *      Cross-chunk parent links aren't supported (clientRefs are scoped
 *      per chunk); the handler logs a warning and promotes orphan
 *      children to root.
 *
 *   3. Error mapping per design §12 — the handler relies on this taxonomy
 *      to decide retry vs. fail.
 */
@Injectable()
export class ClaudeClauseExtractor implements IClauseExtractor {
  private readonly logger = new Logger(ClaudeClauseExtractor.name);

  constructor(
    @Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic,
    @Inject(CLAUDE_MODEL) private readonly model: string,
  ) {}

  async extract(input: ExtractInput): Promise<ExtractedContract> {
    const chunks = this.chunkInput(input);

    if (chunks.length === 1) {
      return this.callOnce(chunks[0]);
    }

    this.logger.log(
      `Splitting document ${input.documentId} into ${chunks.length} chunks for parallel extraction`,
    );

    // Run chunks in parallel. clientRefs are namespaced per chunk so
    // the handler's parent resolver doesn't collapse refs across chunks.
    //
    // Metadata is a document-level artifact, so we take the FIRST chunk's
    // metadata as authoritative — the first chunk typically contains the
    // preamble (parties, dates, term, financials). Per-chunk metadata
    // would need merge rules we don't have a use case for in Phase 8.
    const results = await Promise.all(
      chunks.map((chunk, idx) =>
        this.callOnce(chunk).then((res) => ({
          ...res,
          clauses: res.clauses.map((c) => ({
            ...c,
            clientRef: `chunk${idx}:${c.clientRef}`,
            parentClientRef: c.parentClientRef
              ? `chunk${idx}:${c.parentClientRef}`
              : null,
          })),
        })),
      ),
    );
    return {
      metadata: results[0].metadata,
      clauses: results.flatMap((r) => r.clauses),
    };
  }

  getModelVersion(): string {
    return `anthropic/${this.model}@2026-05`;
  }

  // ── Transport ─────────────────────────────────────────────────────

  private async callOnce(chunkText: string): Promise<ExtractedContract> {
    let response: Anthropic.Messages.Message;
    try {
      response = await this.client.messages.create({
        model: this.model,
        max_tokens: MAX_OUTPUT_TOKENS,
        // System prompt + tool schema are static — cache the prefix.
        // Per-document content (the chunkText) is NOT cached.
        system: [
          {
            type: 'text',
            text: CLAUDE_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools: [EXTRACT_CLAUSES_TOOL],
        tool_choice: { type: 'tool', name: EXTRACT_CLAUSES_TOOL.name },
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: chunkText }],
          },
        ],
      });
    } catch (err) {
      throw this.mapSdkError(err);
    }
    return mapClaudeResponseToClauses(response.content);
  }

  // ── Chunking ──────────────────────────────────────────────────────

  /**
   * Split on page boundaries above the char threshold. Falls back to a
   * single chunk for documents under the threshold (the common case).
   * If a single page already exceeds the threshold we still emit it as
   * one chunk — the Anthropic API will reject it as context_overflow,
   * which we surface as ExtractionPermanentError downstream.
   */
  private chunkInput(input: ExtractInput): string[] {
    if (input.text.length <= CHUNK_THRESHOLD_CHARS) {
      return [input.text];
    }
    if (!input.pages || input.pages.length === 0) {
      // No page boundaries → can't split safely. Send as-is and let the
      // API decide; this should only happen on malformed callers.
      return [input.text];
    }

    const chunks: string[] = [];
    let current = '';
    for (const page of input.pages) {
      const pageText = input.text.slice(page.startOffset, page.endOffset);
      if (current.length + pageText.length > CHUNK_THRESHOLD_CHARS && current.length > 0) {
        chunks.push(current);
        current = '';
      }
      current += pageText;
    }
    if (current.length > 0) chunks.push(current);
    return chunks;
  }

  // ── Error mapping ─────────────────────────────────────────────────

  /**
   * Map Anthropic SDK errors to the project's extraction error taxonomy.
   *   Transient: 429 (rate limit), 503 (overloaded), 529, network/timeout
   *   Permanent: 400 (invalid_request_error, context_overflow), 401, 403
   * Anything else → Permanent('internal_error') so we don't loop forever
   * on unknown faults.
   */
  private mapSdkError(err: unknown): Error {
    if (err instanceof Anthropic.APIError) {
      const status =
        typeof (err as { status?: unknown }).status === 'number'
          ? ((err as { status: number }).status)
          : undefined;
      // Anthropic puts the error.type on err.error.error.type when
      // available; fall back to status-only mapping otherwise.
      const errBody = err.error as { error?: { type?: string } } | undefined;
      const type: string = errBody?.error?.type ?? '';

      if (
        status === 429 ||
        status === 503 ||
        status === 529 ||
        type === 'overloaded_error' ||
        type === 'rate_limit_error'
      ) {
        return new ExtractionTransientError(
          `Claude transient error (status ${status}, type '${type}'): ${err.message}`,
          err,
        );
      }
      if (status === 400 && /context|too long|exceed/i.test(err.message)) {
        return new ExtractionPermanentError(
          'context_overflow',
          `Claude context overflow: ${err.message}`,
        );
      }
      if (status === 401 || status === 403) {
        return new ExtractionPermanentError(
          'unauthorized',
          `Claude rejected credentials (${status}): ${err.message}`,
        );
      }
      if (status === 400) {
        return new ExtractionPermanentError(
          'invalid_request',
          `Claude rejected request: ${err.message}`,
        );
      }
    }

    // Network timeouts, DNS errors, etc.
    if (err instanceof Anthropic.APIConnectionError) {
      return new ExtractionTransientError(
        `Claude connection error: ${err.message}`,
        err,
      );
    }
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      return new ExtractionTransientError(
        `Claude request timed out: ${err.message}`,
        err,
      );
    }

    return new ExtractionPermanentError(
      'internal_error',
      err instanceof Error ? err.message : 'unknown_error',
    );
  }
}
