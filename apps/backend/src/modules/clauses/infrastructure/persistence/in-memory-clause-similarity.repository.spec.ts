import {
  InMemoryClauseSimilarityRepository,
  SeedClause,
} from './in-memory-clause-similarity.repository';

// Tiny 3-dim vectors keep the maths inspectable. Real production uses
// 1024-dim Voyage embeddings, but the algorithm doesn't care about
// dimensionality.

const docA = { id: 'doc-A', title: 'Acme MSA', uploadedAt: new Date('2025-01-01') };
const docB = { id: 'doc-B', title: 'Globex MSA', uploadedAt: new Date('2025-02-01') };
const docC = { id: 'doc-C', title: 'Initech Order', uploadedAt: new Date('2025-03-01') };

function clause(overrides: Partial<SeedClause>): SeedClause {
  return {
    id: 'unknown',
    type: 'lol',
    text: 'placeholder text',
    pageNumber: 1,
    embedding: [1, 0, 0],
    document: docA,
    ...overrides,
  };
}

describe('InMemoryClauseSimilarityRepository', () => {
  let repo: InMemoryClauseSimilarityRepository;

  beforeEach(() => {
    repo = new InMemoryClauseSimilarityRepository();
  });

  it('returns matches ranked by descending similarity', async () => {
    repo.seed([
      clause({ id: 'src', type: 'lol', embedding: [1, 0, 0], document: docA }),
      clause({ id: 'near',     type: 'lol', embedding: [0.95, 0.05, 0], document: docB }),
      clause({ id: 'far',      type: 'lol', embedding: [0.6, 0.4, 0],   document: docB }),
      clause({ id: 'farther',  type: 'lol', embedding: [0.55, 0.45, 0], document: docC }),
    ]);

    const results = await repo.findSimilar({
      sourceClauseId: 'src',
      sourceDocumentId: docA.id,
      clauseType: 'lol',
      limit: 5,
    });

    expect(results.map((r) => r.id)).toEqual(['near', 'far', 'farther']);
    expect(results[0].similarity).toBeGreaterThan(results[1].similarity);
    expect(results[1].similarity).toBeGreaterThan(results[2].similarity);
  });

  it('excludes the source clause and same-document clauses', async () => {
    repo.seed([
      clause({ id: 'src',      type: 'lol', embedding: [1, 0, 0], document: docA }),
      clause({ id: 'sibling',  type: 'lol', embedding: [1, 0, 0], document: docA }), // same doc
      clause({ id: 'precedent',type: 'lol', embedding: [0.9, 0.1, 0], document: docB }),
    ]);

    const results = await repo.findSimilar({
      sourceClauseId: 'src',
      sourceDocumentId: docA.id,
      clauseType: 'lol',
      limit: 5,
    });

    expect(results.map((r) => r.id)).toEqual(['precedent']);
  });

  it('filters by clause type', async () => {
    repo.seed([
      clause({ id: 'src',         type: 'lol',           embedding: [1, 0, 0], document: docA }),
      clause({ id: 'same-type',   type: 'lol',           embedding: [0.9, 0.1, 0], document: docB }),
      clause({ id: 'other-type',  type: 'indemnification', embedding: [1, 0, 0], document: docC }),
    ]);

    const results = await repo.findSimilar({
      sourceClauseId: 'src',
      sourceDocumentId: docA.id,
      clauseType: 'lol',
      limit: 5,
    });

    expect(results.map((r) => r.id)).toEqual(['same-type']);
  });

  it('respects the limit', async () => {
    repo.seed([
      clause({ id: 'src', type: 'lol', embedding: [1, 0, 0], document: docA }),
      clause({ id: 'r1',  type: 'lol', embedding: [0.99, 0.01, 0], document: docB }),
      clause({ id: 'r2',  type: 'lol', embedding: [0.98, 0.02, 0], document: docB }),
      clause({ id: 'r3',  type: 'lol', embedding: [0.97, 0.03, 0], document: docB }),
      clause({ id: 'r4',  type: 'lol', embedding: [0.96, 0.04, 0], document: docB }),
    ]);

    const results = await repo.findSimilar({
      sourceClauseId: 'src',
      sourceDocumentId: docA.id,
      clauseType: 'lol',
      limit: 2,
    });

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id)).toEqual(['r1', 'r2']);
  });

  it('applies the minSimilarity floor (default 0.5)', async () => {
    repo.seed([
      clause({ id: 'src',          type: 'lol', embedding: [1, 0, 0], document: docA }),
      clause({ id: 'strong',       type: 'lol', embedding: [0.9, 0.1, 0], document: docB }),  // sim ≈ 0.994
      clause({ id: 'weak',         type: 'lol', embedding: [0.3, 0.95, 0], document: docB }), // sim ≈ 0.30
    ]);

    const results = await repo.findSimilar({
      sourceClauseId: 'src',
      sourceDocumentId: docA.id,
      clauseType: 'lol',
      limit: 5,
    });

    expect(results.map((r) => r.id)).toEqual(['strong']);
  });

  it('honours explicit minSimilarity overrides', async () => {
    repo.seed([
      clause({ id: 'src',  type: 'lol', embedding: [1, 0, 0], document: docA }),
      clause({ id: 'weak', type: 'lol', embedding: [0.3, 0.95, 0], document: docB }),
    ]);

    const results = await repo.findSimilar({
      sourceClauseId: 'src',
      sourceDocumentId: docA.id,
      clauseType: 'lol',
      limit: 5,
      minSimilarity: 0.1,
    });

    expect(results.map((r) => r.id)).toEqual(['weak']);
  });

  it('returns [] when the source clause is missing', async () => {
    repo.seed([clause({ id: 'unrelated', type: 'lol', document: docB })]);

    const results = await repo.findSimilar({
      sourceClauseId: 'missing',
      sourceDocumentId: docA.id,
      clauseType: 'lol',
      limit: 5,
    });

    expect(results).toEqual([]);
  });

  it('returns [] when the source clause has a null embedding', async () => {
    repo.seed([
      clause({ id: 'src', type: 'lol', embedding: null, document: docA }),
      clause({ id: 'cand', type: 'lol', embedding: [1, 0, 0], document: docB }),
    ]);

    const results = await repo.findSimilar({
      sourceClauseId: 'src',
      sourceDocumentId: docA.id,
      clauseType: 'lol',
      limit: 5,
    });

    expect(results).toEqual([]);
  });

  it('skips candidate clauses with null embeddings', async () => {
    repo.seed([
      clause({ id: 'src',         type: 'lol', embedding: [1, 0, 0], document: docA }),
      clause({ id: 'embedded',    type: 'lol', embedding: [0.9, 0.1, 0], document: docB }),
      clause({ id: 'un-embedded', type: 'lol', embedding: null,          document: docC }),
    ]);

    const results = await repo.findSimilar({
      sourceClauseId: 'src',
      sourceDocumentId: docA.id,
      clauseType: 'lol',
      limit: 5,
    });

    expect(results.map((r) => r.id)).toEqual(['embedded']);
  });
});
