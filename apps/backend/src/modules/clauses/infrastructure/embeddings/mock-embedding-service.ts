import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  EmbeddingResult,
  IEmbeddingService,
} from '../../application/ports/embedding-service.port';
import { EMBEDDING_DIM } from '../../domain/entities/clause';

/**
 * Deterministic stand-in for Voyage. Hashes the input text into a fixed
 * stream of bytes, expands it to `EMBEDDING_DIM` floats in [-1, 1], and
 * L2-normalises the result.
 *
 * Property: same input → same vector. Different inputs → different
 * vectors (with overwhelming probability). Good enough to exercise
 * downstream code paths (persistence, indexing, similarity queries
 * against pgvector) without any network or $.
 */
@Injectable()
export class MockEmbeddingService implements IEmbeddingService {
  static readonly MODEL_VERSION = 'mock/mock-embeddings@v1';

  embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return Promise.resolve(
      texts.map((t) => ({ vector: this.deterministicVector(t) })),
    );
  }

  getModelVersion(): string {
    return MockEmbeddingService.MODEL_VERSION;
  }

  private deterministicVector(text: string): number[] {
    // Hash → seed bytes → expand to EMBEDDING_DIM floats in [-1, 1].
    // We need 4 bytes per float (Float32 reinterpret), so produce
    // EMBEDDING_DIM * 4 bytes by chaining hashes of (seed, counter).
    const seedHash = createHash('sha256').update(text).digest();
    const bytesNeeded = EMBEDDING_DIM * 4;
    const buf = Buffer.alloc(bytesNeeded);
    let written = 0;
    let counter = 0;
    while (written < bytesNeeded) {
      const block = createHash('sha256')
        .update(seedHash)
        .update(Buffer.from([counter & 0xff, (counter >> 8) & 0xff]))
        .digest();
      const take = Math.min(block.length, bytesNeeded - written);
      block.copy(buf, written, 0, take);
      written += take;
      counter += 1;
    }

    const out = new Array<number>(EMBEDDING_DIM);
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      // Each int32 maps to [-1, 1) deterministically.
      const v = buf.readInt32LE(i * 4);
      out[i] = v / 0x80000000;
    }
    // L2-normalise so vectors live on the unit sphere (matches real
    // embedding-API behaviour and makes cosine math sane in tests).
    let sumSq = 0;
    for (const v of out) sumSq += v * v;
    const norm = Math.sqrt(sumSq) || 1;
    for (let i = 0; i < EMBEDDING_DIM; i++) out[i] /= norm;
    return out;
  }
}
