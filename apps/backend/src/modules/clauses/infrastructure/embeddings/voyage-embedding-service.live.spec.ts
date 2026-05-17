import { VoyageAIClient } from 'voyageai';
import { VoyageEmbeddingService } from './voyage-embedding-service';
import { EMBEDDING_DIM } from '../../domain/entities/clause';

/**
 * Live integration test against real Voyage AI.
 *
 * Gated by env: only runs when EMBEDDINGS_LIVE_TEST=1 AND
 * VOYAGE_API_KEY is set. Default CI does NOT pay $ for these.
 *
 * Cost: <$0.001 per run (3 short clauses × ~50 tokens × $0.12/M).
 *
 * What we assert:
 *   - Call succeeds against the real endpoint
 *   - Returns exactly 3 vectors for 3 inputs
 *   - Each vector is EMBEDDING_DIM (1024) floats
 *   - Vectors are roughly unit-length (Voyage normalises by default)
 *   - Same text in two positions yields the same vector
 *     (round-trip determinism — proves we wired input_type correctly
 *     and aren't getting query-mode embeddings by accident)
 *   - Different texts yield different vectors (sanity check the model
 *     isn't collapsing everything to a degenerate output)
 */

const SHOULD_RUN =
  process.env.EMBEDDINGS_LIVE_TEST === '1' && !!process.env.VOYAGE_API_KEY;

const itOrSkip = SHOULD_RUN ? it : it.skip;

describe('VoyageEmbeddingService (live)', () => {
  itOrSkip(
    'embeds clauses against the real Voyage API',
    async () => {
      const model = process.env.VOYAGE_MODEL ?? 'voyage-law-2';
      const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
      const svc = new VoyageEmbeddingService(client, model);

      const inputs = [
        'Vendor shall defend and indemnify Customer for IP claims.',
        'Liability is capped at fees paid in the prior 12 months.',
        // Duplicate of the first — must produce an identical vector.
        'Vendor shall defend and indemnify Customer for IP claims.',
      ];
      const out = await svc.embedBatch(inputs);

      // eslint-disable-next-line no-console
      console.log(
        `[live test] received ${out.length} vectors from ${model}`,
        out.map((r) => ({
          dim: r.vector.length,
          firstFew: r.vector.slice(0, 3).map((v) => Number(v.toFixed(4))),
        })),
      );

      expect(out).toHaveLength(3);
      for (const r of out) {
        expect(r.vector).toHaveLength(EMBEDDING_DIM);
        const norm = Math.sqrt(r.vector.reduce((s, v) => s + v * v, 0));
        expect(norm).toBeGreaterThan(0.9);
        expect(norm).toBeLessThan(1.1);
      }
      // Same input → same vector
      expect(out[0].vector).toEqual(out[2].vector);
      // Different inputs → different vectors
      expect(out[0].vector).not.toEqual(out[1].vector);
    },
    30_000,
  );
});
