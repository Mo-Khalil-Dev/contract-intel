import { GetClauseByIdHandler } from './get-clause-by-id.handler';
import { GetClauseByIdQuery } from './get-clause-by-id.query';
import { IClauseRepository } from '../../domain/clause.repository';
import { Clause } from '../../domain/entities/clause';
import { ClauseType } from '../../domain/value-objects/clause-type.vo';
import { ConfidenceScore } from '../../../documents/domain/value-objects/confidence-score.vo';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { ExtractionRunId } from '../../domain/value-objects/extraction-run-id.vo';
import { TextPosition } from '../../domain/value-objects/text-position.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

function makeClause(): Clause {
  return Clause.create({
    extractionRunId: ExtractionRunId.create(),
    documentId: DocumentId.create(),
    type: ClauseType.fromValue('termination'),
    confidence: ConfidenceScore.fromNumber(0.8),
    position: TextPosition.create({
      startOffset: 0,
      endOffset: 10,
      pageNumber: 1,
    }),
    text: 'terminate',
  });
}

describe('GetClauseByIdHandler', () => {
  it('returns mapped DTO when found', async () => {
    const c = makeClause();
    const handler = new GetClauseByIdHandler({
      saveForRun: jest.fn(),
      findByDocumentId: jest.fn(),
      findById: jest.fn().mockResolvedValue(c),
    } as jest.Mocked<IClauseRepository>);
    const result = await handler.execute(new GetClauseByIdQuery(c.id.value));
    expect(result.id).toBe(c.id.value);
    expect(result.type).toBe('termination');
  });

  it('throws 404 when not found', async () => {
    const handler = new GetClauseByIdHandler({
      saveForRun: jest.fn(),
      findByDocumentId: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
    } as jest.Mocked<IClauseRepository>);
    await expect(
      handler.execute(
        new GetClauseByIdQuery('00000000-0000-4000-8000-000000000000'),
      ),
    ).rejects.toBeInstanceOf(ApplicationException);
  });
});
