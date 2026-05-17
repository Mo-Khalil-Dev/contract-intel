import { MockEmbeddingService } from './mock-embedding-service';
import { EMBEDDING_DIM } from '../../domain/entities/clause';

describe('MockEmbeddingService', () => {
  it('returns one EMBEDDING_DIM vector per input text', async () => {
    const svc = new MockEmbeddingService();
    const r = await svc.embedBatch(['a', 'b', 'c']);
    expect(r).toHaveLength(3);
    for (const item of r) {
      expect(item.vector).toHaveLength(EMBEDDING_DIM);
    }
  });

  it('is deterministic — same text yields same vector', async () => {
    const svc = new MockEmbeddingService();
    const [a] = await svc.embedBatch(['hello']);
    const [b] = await svc.embedBatch(['hello']);
    expect(a.vector).toEqual(b.vector);
  });

  it('different text yields different vectors', async () => {
    const svc = new MockEmbeddingService();
    const r = await svc.embedBatch(['hello', 'world']);
    expect(r[0].vector).not.toEqual(r[1].vector);
  });

  it('vectors are L2-normalised (unit length)', async () => {
    const svc = new MockEmbeddingService();
    const [r] = await svc.embedBatch(['lorem ipsum']);
    const norm = Math.sqrt(r.vector.reduce((acc, v) => acc + v * v, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it('all components are finite', async () => {
    const svc = new MockEmbeddingService();
    const [r] = await svc.embedBatch(['x']);
    expect(r.vector.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('reports a stable model version', () => {
    expect(new MockEmbeddingService().getModelVersion()).toBe(
      'mock/mock-embeddings@v1',
    );
  });
});
