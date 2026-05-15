import { Readable } from 'stream';
import { AppConfigService } from '../../../../config/app-config.service';
import { OcrPermanentError, OcrTransientError } from '../../application/ocr/ocr-errors';
import { DocAiDocument } from './document-ai-response.mapper';
import {
  DocAiClient,
  GcsBucketHelpers,
  GoogleDocAiDriver,
} from './google-doc-ai.driver';

function configFor(overrides: Partial<Record<string, string>> = {}): AppConfigService {
  const defaults: Record<string, string> = {
    ocrGcpProjectId: 'p',
    ocrGcpLocation: 'eu',
    ocrGcpProcessorId: 'abc123',
    ocrGcpBatchOutputPrefix: 'gs://my-bucket/ocr',
  };
  const cfg = { ...defaults, ...overrides };
  return cfg as unknown as AppConfigService;
}

function singlePageDoc(text = 'hello'): DocAiDocument {
  return {
    text,
    pages: [
      {
        pageNumber: 1,
        layout: {
          textAnchor: { textSegments: [{ startIndex: '0', endIndex: String(text.length) }] },
          confidence: 0.95,
        },
        tokens: [
          {
            layout: {
              textAnchor: {
                textSegments: [{ startIndex: '0', endIndex: String(text.length) }],
              },
              confidence: 0.95,
            },
          },
        ],
        detectedLanguages: [{ languageCode: 'en', confidence: 0.99 }],
      },
    ],
  };
}

function fakeClient(opts: {
  processDocument?: jest.Mock;
  batchProcessDocuments?: jest.Mock;
}): jest.Mocked<DocAiClient> {
  return {
    processorPath: jest.fn(
      (p: string, l: string, proc: string) => `projects/${p}/locations/${l}/processors/${proc}`,
    ),
    processDocument: (opts.processDocument ?? jest.fn()),
    batchProcessDocuments: (opts.batchProcessDocuments ?? jest.fn()),
  };
}

function fakeGcs(opts: {
  uploadBytes?: jest.Mock;
  listJsonObjects?: jest.Mock;
}): jest.Mocked<GcsBucketHelpers> {
  return {
    uploadBytes: (opts.uploadBytes ?? jest.fn().mockResolvedValue(undefined)),
    listJsonObjects: (opts.listJsonObjects ?? jest.fn().mockResolvedValue([])),
  };
}

function streamOf(bytes: Uint8Array | string): Readable {
  return Readable.from([typeof bytes === 'string' ? Buffer.from(bytes) : bytes]);
}

describe('GoogleDocAiDriver', () => {
  describe('sync path', () => {
    it('calls processDocument when pageCountHint ≤ 15 and bytes ≤ 20MB', async () => {
      const processDocument = jest
        .fn()
        .mockResolvedValue([{ document: singlePageDoc('Section 1.') }]);
      const client = fakeClient({ processDocument });
      const driver = new GoogleDocAiDriver(configFor(), client, fakeGcs({}));

      const out = await driver.extractText({
        documentId: 'doc-1',
        source: streamOf('pdf-bytes'),
        mimeType: 'application/pdf',
        languages: ['en'],
        pageCountHint: 5,
        byteSizeHint: 1_000_000,
      });

      expect(processDocument).toHaveBeenCalledTimes(1);
      const req = processDocument.mock.calls[0][0];
      expect(req.name).toBe('projects/p/locations/eu/processors/abc123');
      expect(req.rawDocument.mimeType).toBe('application/pdf');
      expect(req.processOptions.ocrConfig.hints.languageHints).toEqual(['en']);

      expect(out.driver).toBe('google_document_ai');
      expect(out.pages).toHaveLength(1);
      expect(out.text).toBe('Section 1.');
    });

    it('throws OcrPermanentError when the response is missing `document`', async () => {
      const client = fakeClient({
        processDocument: jest.fn().mockResolvedValue([{}]),
      });
      const driver = new GoogleDocAiDriver(configFor(), client, fakeGcs({}));

      await expect(
        driver.extractText({
          documentId: 'doc',
          source: streamOf('x'),
          mimeType: 'application/pdf',
          languages: ['en'],
          pageCountHint: 1,
          byteSizeHint: 100,
        }),
      ).rejects.toBeInstanceOf(OcrPermanentError);
    });
  });

  describe('batch path', () => {
    function setUpBatchClient() {
      const operationPromise = jest.fn().mockResolvedValue([{}]);
      const batchProcessDocuments = jest
        .fn()
        .mockResolvedValue([{ promise: operationPromise }]);
      return { batchProcessDocuments, operationPromise };
    }

    it('uses batchProcessDocuments when pageCountHint > 15', async () => {
      const { batchProcessDocuments, operationPromise } = setUpBatchClient();
      const gcs = fakeGcs({
        listJsonObjects: jest.fn().mockResolvedValue([singlePageDoc('shard text')]),
      });
      const client = fakeClient({ batchProcessDocuments });
      const driver = new GoogleDocAiDriver(configFor(), client, gcs);

      const out = await driver.extractText({
        documentId: 'big-doc',
        source: streamOf('pdf-bytes'),
        mimeType: 'application/pdf',
        languages: ['en'],
        pageCountHint: 100,
        byteSizeHint: 30 * 1024 * 1024,
      });

      // Source PDF uploaded to the batch input location.
      expect(gcs.uploadBytes).toHaveBeenCalledTimes(1);
      const [bucket, key] = gcs.uploadBytes.mock.calls[0];
      expect(bucket).toBe('my-bucket');
      expect(key).toMatch(/^ocr\/input\/big-doc\.pdf$/);

      // LRO submitted with the right input + output URIs.
      const req = batchProcessDocuments.mock.calls[0][0] as {
        inputDocuments: { gcsDocuments: { documents: Array<{ gcsUri: string }> } };
        documentOutputConfig: { gcsOutputConfig: { gcsUri: string } };
      };
      expect(req.inputDocuments.gcsDocuments.documents[0].gcsUri).toBe(
        'gs://my-bucket/ocr/input/big-doc.pdf',
      );
      expect(req.documentOutputConfig.gcsOutputConfig.gcsUri).toMatch(
        /^gs:\/\/my-bucket\/ocr\/output\/big-doc\//,
      );

      expect(operationPromise).toHaveBeenCalledTimes(1);
      expect(gcs.listJsonObjects).toHaveBeenCalledTimes(1);
      expect(out.driver).toBe('google_document_ai');
    });

    it('uses batch path when bytes > 20 MB even with low page hint', async () => {
      const { batchProcessDocuments } = setUpBatchClient();
      const gcs = fakeGcs({
        listJsonObjects: jest.fn().mockResolvedValue([singlePageDoc()]),
      });
      const driver = new GoogleDocAiDriver(
        configFor(),
        fakeClient({ batchProcessDocuments }),
        gcs,
      );

      await driver.extractText({
        documentId: 'd',
        source: streamOf(new Uint8Array(21 * 1024 * 1024)),
        mimeType: 'application/pdf',
        languages: ['en'],
        pageCountHint: 5, // would fit sync's page cap, but bytes don't
        byteSizeHint: 21 * 1024 * 1024,
      });

      expect(batchProcessDocuments).toHaveBeenCalledTimes(1);
    });

    it('throws OcrPermanentError when batch returns zero shards', async () => {
      const { batchProcessDocuments } = setUpBatchClient();
      const driver = new GoogleDocAiDriver(
        configFor(),
        fakeClient({ batchProcessDocuments }),
        fakeGcs({ listJsonObjects: jest.fn().mockResolvedValue([]) }),
      );

      await expect(
        driver.extractText({
          documentId: 'd',
          source: streamOf('x'),
          mimeType: 'application/pdf',
          languages: ['en'],
          pageCountHint: 100,
          byteSizeHint: 1000,
        }),
      ).rejects.toMatchObject({ reason: 'empty_batch_output' });
    });
  });

  describe('error mapping', () => {
    it('maps gRPC RESOURCE_EXHAUSTED (8) to OcrTransientError', async () => {
      const err = Object.assign(new Error('quota'), { code: 8 });
      const client = fakeClient({
        processDocument: jest.fn().mockRejectedValue(err),
      });
      const driver = new GoogleDocAiDriver(configFor(), client, fakeGcs({}));

      await expect(
        driver.extractText({
          documentId: 'd',
          source: streamOf('x'),
          mimeType: 'application/pdf',
          languages: ['en'],
          pageCountHint: 1,
          byteSizeHint: 10,
        }),
      ).rejects.toBeInstanceOf(OcrTransientError);
    });

    it.each([4, 14])('maps gRPC code %i to OcrTransientError', async (code) => {
      const err = Object.assign(new Error('transient'), { code });
      const client = fakeClient({
        processDocument: jest.fn().mockRejectedValue(err),
      });
      const driver = new GoogleDocAiDriver(configFor(), client, fakeGcs({}));

      await expect(
        driver.extractText({
          documentId: 'd',
          source: streamOf('x'),
          mimeType: 'application/pdf',
          languages: ['en'],
          pageCountHint: 1,
          byteSizeHint: 10,
        }),
      ).rejects.toBeInstanceOf(OcrTransientError);
    });

    it('maps gRPC INVALID_ARGUMENT (3) to OcrPermanentError', async () => {
      const err = Object.assign(new Error('bad input'), { code: 3 });
      const client = fakeClient({
        processDocument: jest.fn().mockRejectedValue(err),
      });
      const driver = new GoogleDocAiDriver(configFor(), client, fakeGcs({}));

      await expect(
        driver.extractText({
          documentId: 'd',
          source: streamOf('x'),
          mimeType: 'application/pdf',
          languages: ['en'],
          pageCountHint: 1,
          byteSizeHint: 10,
        }),
      ).rejects.toBeInstanceOf(OcrPermanentError);
    });
  });

  describe('config validation', () => {
    it('throws OcrPermanentError when project id is missing', async () => {
      const driver = new GoogleDocAiDriver(
        configFor({ ocrGcpProjectId: undefined as unknown as string }),
        fakeClient({ processDocument: jest.fn() }),
        fakeGcs({}),
      );

      await expect(
        driver.extractText({
          documentId: 'd',
          source: streamOf('x'),
          mimeType: 'application/pdf',
          languages: ['en'],
          pageCountHint: 1,
          byteSizeHint: 10,
        }),
      ).rejects.toThrow(/OCR_GCP_PROJECT_ID/);
    });

    it('throws when OCR_GCP_BATCH_OUTPUT_PREFIX is not a gs:// URI', async () => {
      const driver = new GoogleDocAiDriver(
        configFor({ ocrGcpBatchOutputPrefix: '/local/path' }),
        fakeClient({
          batchProcessDocuments: jest
            .fn()
            .mockResolvedValue([{ promise: jest.fn().mockResolvedValue([{}]) }]),
        }),
        fakeGcs({}),
      );

      await expect(
        driver.extractText({
          documentId: 'd',
          source: streamOf('x'),
          mimeType: 'application/pdf',
          languages: ['en'],
          pageCountHint: 100,
          byteSizeHint: 10,
        }),
      ).rejects.toThrow(/gs:\/\/bucket\/prefix/);
    });
  });
});
