import { GetClausesForDocumentHandler } from './get-clauses-for-document.handler';
import { GetClausesForDocumentQuery } from './get-clauses-for-document.query';
import { IClauseRepository } from '../../domain/clause.repository';
import { Clause } from '../../domain/entities/clause';
import { ClauseType } from '../../domain/value-objects/clause-type.vo';
import { ConfidenceScore } from '../../../documents/domain/value-objects/confidence-score.vo';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { ExtractionRunId } from '../../domain/value-objects/extraction-run-id.vo';
import { TextPosition } from '../../domain/value-objects/text-position.vo';

function fakeRepo(clauses: Clause[]): jest.Mocked<IClauseRepository> {
  return {
    saveForRun: jest.fn(),
    findByDocumentId: jest.fn().mockResolvedValue(clauses),
    findById: jest.fn(),
  };
}

describe('GetClausesForDocumentHandler', () => {
  it('returns mapped DTOs for the document', async () => {
    const docId = DocumentId.create();
    const runId = ExtractionRunId.create();
    const c = Clause.create({
      extractionRunId: runId,
      documentId: docId,
      type: ClauseType.fromValue('indemnification'),
      confidence: ConfidenceScore.fromNumber(0.9),
      position: TextPosition.create({
        startOffset: 0,
        endOffset: 10,
        pageNumber: 1,
      }),
      text: 'sample text',
    });
    const handler = new GetClausesForDocumentHandler(fakeRepo([c]));

    const result = await handler.execute(
      new GetClausesForDocumentQuery(docId.value),
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(c.id.value);
    expect(result[0].type).toBe('indemnification');
    expect(result[0].confidence).toBe(0.9);
    expect(result[0].pageNumber).toBe(1);
    expect(result[0].text).toBe('sample text');
    expect(result[0].hasEmbedding).toBe(false);
    expect(result[0].risk).toBeNull();
  });

  it('returns [] when no clauses', async () => {
    const handler = new GetClausesForDocumentHandler(fakeRepo([]));
    const result = await handler.execute(
      new GetClausesForDocumentQuery(DocumentId.create().value),
    );
    expect(result).toEqual([]);
  });
});
