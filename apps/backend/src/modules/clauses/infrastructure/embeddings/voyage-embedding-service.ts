import { Inject, Injectable, Logger } from '@nestjs/common';
import { VoyageAIClient, VoyageAIError, VoyageAITimeoutError } from 'voyageai';
import {
  EmbeddingResult,
  IEmbeddingService,
} from '../../application/ports/embedding-service.port';
import {
  EmbeddingPermanentError,
  EmbeddingTransientError,
} from '../../application/errors/clause-extraction-errors';
import { EMBEDDING_DIM } from '../../domain/entities/clause';

export const VOYAGE_CLIENT = Symbol('VOYAGE_CLIENT');
export const VOYAGE_MODEL = Symbol('VOYAGE_MODEL');

/**
 * Voyage AI's batch limit. The SDK enforces this server-side too —
 * exceeding it returns a 400. We split locally so the cap is invisible
 * to callers.
 */
const VOYAGE_BATCH_LIMIT = 128;

/**
 * Real embedding driver. Same shape as MockEmbeddingService — the handler
 * doesn't know which one it's using.
 *
 * Three things this adapter is responsible for:
 *
 *   1. Transport: one (or N) Voyage `embed` calls with `input_type:
 *      'document'`. (The `'query'` variant lives elsewhere — Phase 10
 *      semantic-search query embedding.)
 *
 *   2. Batching: split inputs into chunks of <=128. Voyage rejects
 *      larger batches with a 400. Chunks are sent in parallel.
 *
 *   3. Error mapping per design §12:
 *        429 / 5xx                       → EmbeddingTransientError
 *        Connection / timeout            → EmbeddingTransientError
 *        400 / 401 / 403                 → EmbeddingPermanentError
 *        Output dim != EMBEDDING_DIM     → EmbeddingPermanentError
 *          (defends against future model swap with mismatched dim —
 *           pgvector column is locked at 1024 in the schema)
 */
@Injectable()
export class VoyageEmbeddingService implements IEmbeddingService {
  private readonly logger = new Logger(VoyageEmbeddingService.name);

  constructor(
    @Inject(VOYAGE_CLIENT) private readonly client: VoyageAIClient,
    @Inject(VOYAGE_MODEL) private readonly model: string,
  ) {}

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];

    const batches = this.chunk(texts, VOYAGE_BATCH_LIMIT);
    if (batches.length > 1) {
      this.logger.log(
        `Splitting ${texts.length} embeddings into ${batches.length} batches of ≤${VOYAGE_BATCH_LIMIT}`,
      );
    }

    const batchResults = await Promise.all(
      batches.map((batch) => this.callOnce(batch)),
    );
    return batchResults.flat();
  }

  getModelVersion(): string {
    return `voyage/${this.model}@2026-05`;
  }

  // ── Transport ─────────────────────────────────────────────────────

  private async callOnce(batch: string[]): Promise<EmbeddingResult[]> {
    let response;
    try {
      response = await this.client.embed({
        input: batch,
        model: this.model,
        inputType: 'document',
      });
    } catch (err) {
      throw this.mapSdkError(err);
    }

    const data = response.data ?? [];
    if (data.length !== batch.length) {
      throw new EmbeddingPermanentError(
        'corrupt_response',
        `Voyage returned ${data.length} embeddings for ${batch.length} inputs`,
      );
    }

    // Voyage returns items in the same order as input but the .index
    // field disambiguates either way. Sort defensively.
    const sorted = [...data].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );

    return sorted.map((d, i) => {
      const vector = d.embedding;
      if (!Array.isArray(vector)) {
        throw new EmbeddingPermanentError(
          'corrupt_response',
          `Voyage response item #${i} has non-array embedding`,
        );
      }
      if (vector.length !== EMBEDDING_DIM) {
        throw new EmbeddingPermanentError(
          'dimension_mismatch',
          `Voyage returned ${vector.length}-dim vector; schema requires ${EMBEDDING_DIM}. ` +
            `Check VOYAGE_MODEL — switching models requires a pgvector migration.`,
        );
      }
      return { vector };
    });
  }

  // ── Chunking ──────────────────────────────────────────────────────

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  // ── Error mapping ─────────────────────────────────────────────────

  private mapSdkError(err: unknown): Error {
    if (err instanceof VoyageAITimeoutError) {
      return new EmbeddingTransientError(
        `Voyage request timed out: ${err.message}`,
        err,
      );
    }
    if (err instanceof VoyageAIError) {
      const status =
        typeof err.statusCode === 'number' ? err.statusCode : undefined;

      if (status === 429 || (status !== undefined && status >= 500)) {
        return new EmbeddingTransientError(
          `Voyage transient error (status ${status}): ${err.message}`,
          err,
        );
      }
      if (status === 401 || status === 403) {
        return new EmbeddingPermanentError(
          'unauthorized',
          `Voyage rejected credentials (${status}): ${err.message}`,
        );
      }
      if (status === 400) {
        return new EmbeddingPermanentError(
          'invalid_request',
          `Voyage rejected request: ${err.message}`,
        );
      }
    }

    // ENOTFOUND / ECONNRESET / fetch failures with no status — treat as
    // transient so the handler retries.
    if (err instanceof Error && /ENOTFOUND|ECONNRESET|fetch failed|network/i.test(err.message)) {
      return new EmbeddingTransientError(`Voyage connection error: ${err.message}`, err);
    }

    return new EmbeddingPermanentError(
      'internal_error',
      err instanceof Error ? err.message : 'unknown_error',
    );
  }
}
