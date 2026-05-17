import { EventBus } from '@nestjs/cqrs';
import { FailClauseExtractionHandler } from './fail-clause-extraction.handler';
import { FailClauseExtractionCommand } from './fail-clause-extraction.command';
import { IDocumentRepository } from '../../../documents/domain/document.repository';
import { IExtractionRunRepository } from '../../domain/extraction-run.repository';
import { ExtractionRun } from '../../domain/aggregates/extraction-run.aggregate';
import { Document } from '../../../documents/domain/document.aggregate';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { DocumentName } from '../../../documents/domain/value-objects/document-name.vo';
import { DocumentType } from '../../../documents/domain/value-objects/document-type.vo';
import { FileSize } from '../../../documents/domain/value-objects/file-size.vo';
import { OrgId } from '../../../documents/domain/value-objects/org-id.vo';
import { StorageKey } from '../../../documents/domain/value-objects/storage-key.vo';
import { UploadedBy } from '../../../documents/domain/value-objects/uploaded-by.vo';
import { ModelVersion } from '../../domain/value-objects/model-version.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

const USER_ID = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';

function extractingDoc(): { doc: Document; run: ExtractionRun } {
  const id = DocumentId.create();
  const type = DocumentType.fromValue('PDF');
  const uploadedBy = UploadedBy.fromUserId(USER_ID);
  const doc = Document.create({
    id,
    name: DocumentName.create('contract.pdf'),
    type,
    size: FileSize.fromBytes(1000),
    storageKey: StorageKey.forDocument(id, type),
    uploadedBy,
    orgId: OrgId.fromUploader(uploadedBy),
  });
  doc.markComplete();
  doc.startProcessing();
  doc.completeProcessing({
    driver: 'native_pdf',
    language: 'en',
    confidence: 1,
    pageCount: 1,
  });
  const run = ExtractionRun.start({
    documentId: id,
    classifierModelVersion: ModelVersion.parse('anthropic/claude-opus-4-7@2026-05'),
    embeddingModelVersion: ModelVersion.parse('voyage/voyage-law-2@2026-05'),
  });
  doc.startExtraction(run.id.value);
  doc.pullDomainEvents();
  run.pullDomainEvents();
  return { doc, run };
}

function fakeBus(): jest.Mocked<EventBus> {
  return { publishAll: jest.fn() } as unknown as jest.Mocked<EventBus>;
}
function fakeDocRepo(doc: Document | null): jest.Mocked<IDocumentRepository> {
  return {
    findByIdForOrg: jest.fn(),
    findById: jest.fn().mockResolvedValue(doc),
    save: jest.fn().mockResolvedValue(undefined),
  };
}
function fakeRunRepo(run: ExtractionRun | null): jest.Mocked<IExtractionRunRepository> {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findCurrentForDocument: jest.fn().mockResolvedValue(run),
  };
}

describe('FailClauseExtractionHandler', () => {
  it('fails an in-flight run and transitions the document to extraction_failed', async () => {
    const { doc, run } = extractingDoc();
    const docRepo = fakeDocRepo(doc);
    const runRepo = fakeRunRepo(run);
    const handler = new FailClauseExtractionHandler(docRepo, runRepo, fakeBus());

    await handler.execute(
      new FailClauseExtractionCommand(doc.id.value, 'manual_abort'),
    );

    expect(runRepo.save).toHaveBeenCalledTimes(1);
    expect(run.isFailed()).toBe(true);
    expect(doc.extractionStatus.value).toBe('extraction_failed');
  });

  it('is a no-op when run already complete and document not extracting', async () => {
    const { doc, run } = extractingDoc();
    run.complete({ clauseCount: 1, droppedClauseCount: 0 });
    doc.completeExtraction();
    const docRepo = fakeDocRepo(doc);
    const runRepo = fakeRunRepo(run);
    const handler = new FailClauseExtractionHandler(docRepo, runRepo, fakeBus());

    await handler.execute(
      new FailClauseExtractionCommand(doc.id.value, 'manual_abort'),
    );

    expect(runRepo.save).not.toHaveBeenCalled();
    expect(docRepo.save).not.toHaveBeenCalled();
  });

  it('throws 404 when document missing', async () => {
    const handler = new FailClauseExtractionHandler(
      fakeDocRepo(null),
      fakeRunRepo(null),
      fakeBus(),
    );
    await expect(
      handler.execute(
        new FailClauseExtractionCommand(
          '00000000-0000-4000-8000-000000000000',
          'reason',
        ),
      ),
    ).rejects.toBeInstanceOf(ApplicationException);
  });
});
