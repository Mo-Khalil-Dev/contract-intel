import { GetExtractionRunStatusHandler } from './get-extraction-run-status.handler';
import { GetExtractionRunStatusQuery } from './get-extraction-run-status.query';
import { IExtractionRunRepository } from '../../domain/extraction-run.repository';
import { ExtractionRun } from '../../domain/aggregates/extraction-run.aggregate';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { ModelVersion } from '../../domain/value-objects/model-version.vo';
import { ContractMetadata } from '../../domain/value-objects/contract-metadata.vo';

function makeRun(documentId: DocumentId): ExtractionRun {
  return ExtractionRun.start({
    documentId,
    classifierModelVersion: ModelVersion.parse('anthropic/claude-opus-4-7@2026-05'),
    embeddingModelVersion: ModelVersion.parse('voyage/voyage-law-2@2026-05'),
  });
}

function fakeRepo(run: ExtractionRun | null): jest.Mocked<IExtractionRunRepository> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findCurrentForDocument: jest.fn().mockResolvedValue(run),
  };
}

describe('GetExtractionRunStatusHandler', () => {
  it("returns 'not_started' shape when no run exists", async () => {
    const handler = new GetExtractionRunStatusHandler(fakeRepo(null));
    const result = await handler.execute(
      new GetExtractionRunStatusQuery(DocumentId.create().value),
    );
    expect(result.status).toBe('not_started');
    expect(result.runId).toBeNull();
    expect(result.clauseCount).toBe(0);
  });

  it('returns running run state', async () => {
    const docId = DocumentId.create();
    const run = makeRun(docId);
    const handler = new GetExtractionRunStatusHandler(fakeRepo(run));
    const result = await handler.execute(
      new GetExtractionRunStatusQuery(docId.value),
    );
    expect(result.status).toBe('running');
    expect(result.runId).toBe(run.id.value);
    expect(result.completedAt).toBeNull();
  });

  it('returns complete run state with counts', async () => {
    const docId = DocumentId.create();
    const run = makeRun(docId);
    run.complete({ clauseCount: 3, droppedClauseCount: 1 });
    const handler = new GetExtractionRunStatusHandler(fakeRepo(run));
    const result = await handler.execute(
      new GetExtractionRunStatusQuery(docId.value),
    );
    expect(result.status).toBe('complete');
    expect(result.clauseCount).toBe(3);
    expect(result.droppedClauseCount).toBe(1);
    expect(result.completedAt).not.toBeNull();
    expect(result.metadata).toBeNull();
  });

  it('exposes metadata in the DTO when present', async () => {
    const docId = DocumentId.create();
    const run = makeRun(docId);
    const metadata = ContractMetadata.create({
      contractType: 'Vendor',
      parties: [{ role: 'Provider', name: 'Acme' }],
      paymentAmount: '£50,000',
    });
    run.complete({ clauseCount: 1, droppedClauseCount: 0, metadata });
    const handler = new GetExtractionRunStatusHandler(fakeRepo(run));
    const result = await handler.execute(
      new GetExtractionRunStatusQuery(docId.value),
    );
    expect(result.metadata).not.toBeNull();
    expect(result.metadata?.contractType).toBe('Vendor');
    expect(result.metadata?.parties).toEqual([{ role: 'Provider', name: 'Acme' }]);
    expect(result.metadata?.paymentAmount).toBe('£50,000');
  });

  it('returns failed run state with reason', async () => {
    const docId = DocumentId.create();
    const run = makeRun(docId);
    run.fail('claude_unavailable');
    const handler = new GetExtractionRunStatusHandler(fakeRepo(run));
    const result = await handler.execute(
      new GetExtractionRunStatusQuery(docId.value),
    );
    expect(result.status).toBe('failed');
    expect(result.failureReason).toBe('claude_unavailable');
  });
});
