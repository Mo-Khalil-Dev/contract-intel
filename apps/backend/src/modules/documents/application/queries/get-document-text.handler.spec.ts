import { GetDocumentTextHandler } from './get-document-text.handler';
import { GetDocumentTextQuery } from './get-document-text.query';
import { IDocumentRepository } from '../../domain/document.repository';
import { IDocumentTextRepository } from '../../domain/document-text.repository';
import { Document } from '../../domain/document.aggregate';
import { DocumentText } from '../../domain/document-text.aggregate';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.vo';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { DocumentName } from '../../domain/value-objects/document-name.vo';
import { DocumentType } from '../../domain/value-objects/document-type.vo';
import { FileSize } from '../../domain/value-objects/file-size.vo';
import { Language } from '../../domain/value-objects/language.vo';
import { OcrDriver } from '../../domain/value-objects/ocr-driver.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { PageText } from '../../domain/value-objects/page-text.vo';
import { StorageKey } from '../../domain/value-objects/storage-key.vo';
import { TextQualityScore } from '../../domain/value-objects/text-quality-score.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

const USER_ID = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';

function ownedDoc(): Document {
  const id = DocumentId.create();
  const type = DocumentType.fromValue('PDF');
  const uploadedBy = UploadedBy.fromUserId(USER_ID);
  return Document.create({
    id,
    name: DocumentName.create('contract.pdf'),
    type,
    size: FileSize.fromBytes(1000),
    storageKey: StorageKey.forDocument(id, type),
    uploadedBy,
    orgId: OrgId.fromUploader(uploadedBy),
  });
}

function fakeText(id: DocumentId): DocumentText {
  return DocumentText.fromOcrOutput({
    documentId: id,
    text: 'hello world',
    pages: [
      PageText.create({
        pageNumber: 1,
        text: 'hello world',
        confidence: ConfidenceScore.fromNumber(0.99),
        textQualityScore: TextQualityScore.fromNumber(0.9),
        driver: OcrDriver.nativePdf(),
      }),
    ],
    language: Language.fromCode('en'),
  });
}

describe('GetDocumentTextHandler', () => {
  it('returns the dto when the document and its text exist', async () => {
    const doc = ownedDoc();
    const text = fakeText(doc.id);
    const docs: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const texts: jest.Mocked<IDocumentTextRepository> = {
      findByDocumentId: jest.fn().mockResolvedValue(text),
      save: jest.fn(),
    };
    const handler = new GetDocumentTextHandler(docs, texts);

    const result = await handler.execute(new GetDocumentTextQuery(doc.id.value, USER_ID));

    expect(result.documentId).toBe(doc.id.value);
    expect(result.text).toBe('hello world');
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].driver).toBe('native_pdf');
    expect(result.language).toBe('en');
  });

  it('404s when the document is not in the requester\'s org', async () => {
    const docs: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const texts: jest.Mocked<IDocumentTextRepository> = {
      findByDocumentId: jest.fn(),
      save: jest.fn(),
    };
    const handler = new GetDocumentTextHandler(docs, texts);

    await expect(
      handler.execute(new GetDocumentTextQuery(DocumentId.create().value, USER_ID)),
    ).rejects.toBeInstanceOf(ApplicationException);
    expect(texts.findByDocumentId).not.toHaveBeenCalled();
  });

  it('404s when OCR has not run yet (document found, text missing)', async () => {
    const doc = ownedDoc();
    const docs: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const texts: jest.Mocked<IDocumentTextRepository> = {
      findByDocumentId: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const handler = new GetDocumentTextHandler(docs, texts);

    await expect(
      handler.execute(new GetDocumentTextQuery(doc.id.value, USER_ID)),
    ).rejects.toThrow(/has not produced text/);
  });
});
