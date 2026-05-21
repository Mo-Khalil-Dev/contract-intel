import {
  GetSimilarClausesHandler,
  MAX_LIMIT,
} from './get-similar-clauses.handler';
import { GetSimilarClausesQuery } from './get-similar-clauses.query';
import { SNIPPET_MAX_LENGTH } from './similar-clauses.dto';
import { InMemoryClauseSimilarityRepository } from '../../infrastructure/persistence/in-memory-clause-similarity.repository';
import { IClauseRepository } from '../../domain/clause.repository';
import { Clause } from '../../domain/entities/clause';
import { ClauseId } from '../../domain/value-objects/clause-id.vo';
import { ClauseType } from '../../domain/value-objects/clause-type.vo';
import { ExtractionRunId } from '../../domain/value-objects/extraction-run-id.vo';
import { TextPosition } from '../../domain/value-objects/text-position.vo';
import { ConfidenceScore } from '../../../documents/domain/value-objects/confidence-score.vo';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

// ── Test scaffolding ───────────────────────────────────────────────────

// DocumentId / ClauseId VOs require valid v4 UUIDs.
const docA = {
  id: DocumentId.create().value,
  title: 'Acme MSA',
  uploadedAt: new Date('2025-01-01'),
};
const docB = {
  id: DocumentId.create().value,
  title: 'Globex MSA',
  uploadedAt: new Date('2025-02-01'),
};
const NEAR_ID = ClauseId.create().value;

interface MakeClauseOpts {
  id?: string;
  documentId?: string;
  type?: string;
  text?: string;
  withEmbedding?: boolean;
}

/** Build a real Clause domain entity, with an optional embedding. */
function makeClause(opts: MakeClauseOpts = {}): Clause {
  const clauseId = opts.id ? ClauseId.fromString(opts.id) : ClauseId.create();
  const docId = opts.documentId
    ? DocumentId.fromString(opts.documentId)
    : DocumentId.fromString(docA.id);
  const text = opts.text ?? 'limitation of liability clause body';
  // Rehydrate so we can set the embedding directly; create() doesn't expose it.
  return Clause.rehydrate(clauseId, {
    extractionRunId: ExtractionRunId.create(),
    documentId: docId,
    parentClauseId: null,
    type: ClauseType.fromValue(opts.type ?? 'limitation_of_liability'),
    confidence: ConfidenceScore.fromNumber(0.9),
    position: TextPosition.create({ startOffset: 0, endOffset: text.length, pageNumber: 1 }),
    text,
    embedding: opts.withEmbedding ? [1, 0, 0] : null,
    embeddingModelVersion: null,
    risk: null,
    createdAt: new Date('2025-01-01'),
  });
}

function stubClauseRepo(source: Clause | null): jest.Mocked<IClauseRepository> {
  return {
    saveForRun: jest.fn(),
    findByDocumentId: jest.fn(),
    findById: jest.fn().mockResolvedValue(source),
  };
}

// ── Suite ──────────────────────────────────────────────────────────────

describe('GetSimilarClausesHandler', () => {
  let simRepo: InMemoryClauseSimilarityRepository;

  beforeEach(() => {
    simRepo = new InMemoryClauseSimilarityRepository();
  });

  it('returns the source clause summary plus mapped results', async () => {
    const src = makeClause({
      documentId: docA.id,
      type: 'limitation_of_liability',
      text: 'Liability shall not exceed twelve months fees.',
      withEmbedding: true,
    });
    simRepo.seed([
      { id: src.id.value, type: 'limitation_of_liability', text: src.text, pageNumber: 1,
        embedding: [1, 0, 0], document: docA },
      { id: NEAR_ID, type: 'limitation_of_liability', text: 'Aggregate liability capped.',
        pageNumber: 5, embedding: [0.95, 0.05, 0], document: docB },
    ]);
    const handler = new GetSimilarClausesHandler(stubClauseRepo(src), simRepo);

    const out = await handler.execute(new GetSimilarClausesQuery(src.id.value, 5));

    expect(out.source.id).toBe(src.id.value);
    expect(out.source.type).toBe('limitation_of_liability');
    expect(out.source.documentId).toBe(docA.id);
    expect(out.source.textSnippet).toContain('Liability shall not exceed');

    expect(out.results).toHaveLength(1);
    expect(out.results[0].id).toBe(NEAR_ID);
    expect(out.results[0].similarity).toBeGreaterThan(0.9);
    expect(out.results[0].document.title).toBe('Globex MSA');
    // ISO date serialisation
    expect(out.results[0].document.uploadedAt).toBe('2025-02-01T00:00:00.000Z');
  });

  it('throws 404 CLAUSE_NOT_FOUND when the source clause does not exist', async () => {
    const handler = new GetSimilarClausesHandler(stubClauseRepo(null), simRepo);
    // Valid UUID shape so we get past VO validation and into the "not found" path.
    const missingId = ClauseId.create().value;
    await expect(
      handler.execute(new GetSimilarClausesQuery(missingId)),
    ).rejects.toMatchObject({
      code: 'CLAUSE_NOT_FOUND',
      httpStatus: 404,
    } satisfies Partial<ApplicationException>);
  });

  it('throws 409 CLAUSE_NOT_EMBEDDED when the source has no embedding', async () => {
    const src = makeClause({ withEmbedding: false });
    const handler = new GetSimilarClausesHandler(stubClauseRepo(src), simRepo);
    await expect(
      handler.execute(new GetSimilarClausesQuery(src.id.value)),
    ).rejects.toMatchObject({
      code: 'CLAUSE_NOT_EMBEDDED',
      httpStatus: 409,
    });
  });

  it('throws 400 INVALID_LIMIT for non-integer / out-of-range limit', async () => {
    const src = makeClause({ withEmbedding: true });
    const handler = new GetSimilarClausesHandler(stubClauseRepo(src), simRepo);

    for (const bad of [0, -1, 1.5, MAX_LIMIT + 1]) {
      await expect(
        handler.execute(new GetSimilarClausesQuery(src.id.value, bad)),
      ).rejects.toMatchObject({
        code: 'INVALID_LIMIT',
        httpStatus: 400,
      });
    }
  });

  it('passes the source clauseType and documentId through to the repository', async () => {
    const src = makeClause({
      documentId: docA.id,
      type: 'indemnification',
      withEmbedding: true,
    });
    const findSimilar = jest.fn().mockResolvedValue([]);
    const handler = new GetSimilarClausesHandler(stubClauseRepo(src), { findSimilar });

    await handler.execute(new GetSimilarClausesQuery(src.id.value, 3));

    expect(findSimilar).toHaveBeenCalledWith({
      sourceClauseId: src.id.value,
      sourceDocumentId: docA.id,
      clauseType: 'indemnification',
      limit: 3,
    });
  });

  it('returns an empty results array when nothing matches', async () => {
    const src = makeClause({ withEmbedding: true });
    simRepo.seed([
      { id: src.id.value, type: 'limitation_of_liability', text: src.text, pageNumber: 1,
        embedding: [1, 0, 0], document: docA },
    ]);
    const handler = new GetSimilarClausesHandler(stubClauseRepo(src), simRepo);

    const out = await handler.execute(new GetSimilarClausesQuery(src.id.value));

    expect(out.results).toEqual([]);
    expect(out.source.id).toBe(src.id.value);
  });

  it('trims very long source text into a snippet capped at SNIPPET_MAX_LENGTH', async () => {
    const longText = 'A'.repeat(SNIPPET_MAX_LENGTH * 2);
    const src = makeClause({ text: longText, withEmbedding: true });
    const handler = new GetSimilarClausesHandler(stubClauseRepo(src), simRepo);

    const out = await handler.execute(new GetSimilarClausesQuery(src.id.value));

    // Snippet is capped at MAX + 1 char for the ellipsis.
    expect(out.source.textSnippet.length).toBeLessThanOrEqual(
      SNIPPET_MAX_LENGTH + 1,
    );
    expect(out.source.textSnippet.endsWith('…')).toBe(true);
  });
});
