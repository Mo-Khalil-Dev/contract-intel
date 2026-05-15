import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Readable } from 'stream';
import { AppConfigService } from '../../../../config/app-config.service';
import {
  OcrPermanentError,
  OcrTransientError,
} from '../../application/ocr/ocr-errors';
import {
  IOcrService,
  OcrInput,
  OcrOutput,
} from '../../domain/ports/ocr-service.port';
import {
  DocAiDocument,
  mapDocAiDocumentsToOcrOutput,
} from './document-ai-response.mapper';

// Sync API caps from Document AI. Above either, we must use batch.
const SYNC_PAGE_LIMIT = 15;
const SYNC_BYTE_LIMIT = 20 * 1024 * 1024;

// gRPC status codes we treat as transient. Anything else (or no code)
// is permanent — see `OcrTransientError` vs `OcrPermanentError`.
const TRANSIENT_GRPC_CODES = new Set<number>([
  4, // DEADLINE_EXCEEDED
  8, // RESOURCE_EXHAUSTED — Document AI's "you hit the quota" code
  14, // UNAVAILABLE
]);

// SDK clients are heavy to construct; the driver caches them per-instance.
// `DocumentProcessorServiceClient` is the SDK class but we import it lazily
// to keep test files from pulling the whole transitive dependency tree.
export interface DocAiClient {
  processorPath(project: string, location: string, processor: string): string;
  processDocument(req: unknown): Promise<[{ document?: DocAiDocument | null }]>;
  batchProcessDocuments(
    req: unknown,
  ): Promise<
    [
      {
        promise(): Promise<[{ metadata?: BatchMetadata | null }]>;
      },
    ]
  >;
}

export interface BatchMetadata {
  individualProcessStatuses?: Array<{
    outputGcsDestination?: string | null;
    inputGcsSource?: string | null;
    status?: { code?: number | null; message?: string | null } | null;
  }> | null;
}

export interface GcsBucketHelpers {
  uploadBytes(bucket: string, key: string, bytes: Uint8Array): Promise<void>;
  listJsonObjects(bucket: string, prefix: string): Promise<DocAiDocument[]>;
}

export const DOC_AI_CLIENT = Symbol('DOC_AI_CLIENT');
export const DOC_AI_GCS_HELPERS = Symbol('DOC_AI_GCS_HELPERS');

/**
 * Google Document AI driver.
 *
 * Two internal paths, one public method:
 *   - sync  (`processDocument`)        — ≤15 pages, ≤20 MB. Fast (1–3s/page).
 *   - batch (`batchProcessDocuments`)  — everything else. Slower (5–30s
 *     startup, 0.5–2s/page), no hard page cap below our 200 limit.
 *
 * Both reduce to "run the model, hand the response(s) to the pure mapper,
 * return an OcrOutput." The mapper (document-ai-response.mapper.ts)
 * lives elsewhere and is unit-tested separately.
 *
 * The batch path uploads the source PDF to a temp GCS location, calls
 * the LRO, polls it to completion, then reads per-shard JSON results
 * back from the output prefix.
 */
@Injectable()
export class GoogleDocAiDriver implements IOcrService {
  private readonly logger = new Logger(GoogleDocAiDriver.name);

  constructor(
    private readonly config: AppConfigService,
    @Inject(DOC_AI_CLIENT) private readonly client: DocAiClient,
    @Inject(DOC_AI_GCS_HELPERS) private readonly gcs: GcsBucketHelpers,
  ) {}

  async extractText(input: OcrInput): Promise<OcrOutput> {
    const bytes = await readAllBytes(input.source);
    const pageCount = input.pageCountHint ?? Number.POSITIVE_INFINITY;
    const fitsSync = pageCount <= SYNC_PAGE_LIMIT && bytes.length <= SYNC_BYTE_LIMIT;

    this.logger.log(
      `Document AI: documentId=${input.documentId} bytes=${bytes.length} pageHint=${
        Number.isFinite(pageCount) ? pageCount : '?'
      } path=${fitsSync ? 'sync' : 'batch'}`,
    );

    try {
      return fitsSync
        ? await this.extractSync(bytes, input.languages)
        : await this.extractBatch(input.documentId, bytes, input.languages);
    } catch (err) {
      throw this.mapError(err);
    }
  }

  private async extractSync(bytes: Uint8Array, languages: string[]): Promise<OcrOutput> {
    const name = this.processorName();
    const [response] = await this.client.processDocument({
      name,
      rawDocument: {
        // SDK expects content as base64 string for `bytes` proto fields.
        content: Buffer.from(bytes).toString('base64'),
        mimeType: 'application/pdf',
      },
      processOptions: { ocrConfig: { hints: { languageHints: languages } } },
    });
    if (!response.document) {
      throw new OcrPermanentError(
        'corrupt_response',
        'Document AI returned no `document` in the response',
      );
    }
    return mapDocAiDocumentsToOcrOutput([response.document], languages[0] ?? 'en');
  }

  private async extractBatch(
    documentId: string,
    bytes: Uint8Array,
    languages: string[],
  ): Promise<OcrOutput> {
    const { inputBucket, inputKey, outputBucket, outputPrefix } =
      this.batchLocations(documentId);

    // 1. Park the source PDF where Document AI can read it.
    await this.gcs.uploadBytes(inputBucket, inputKey, bytes);

    // 2. Kick off the LRO.
    const [operation] = await this.client.batchProcessDocuments({
      name: this.processorName(),
      inputDocuments: {
        gcsDocuments: {
          documents: [
            {
              gcsUri: `gs://${inputBucket}/${inputKey}`,
              mimeType: 'application/pdf',
            },
          ],
        },
      },
      documentOutputConfig: {
        gcsOutputConfig: { gcsUri: `gs://${outputBucket}/${outputPrefix}` },
      },
      processOptions: { ocrConfig: { hints: { languageHints: languages } } },
    });

    // 3. Wait for completion. SDK's LRO `promise()` polls under the hood
    //    and resolves once the operation is `done`. Cancellation / timeouts
    //    are inherited from the caller's retry policy (the application-
    //    layer handler enforces backoff and a max-attempts cap).
    await operation.promise();

    // 4. Read per-shard JSON results from the output prefix. Document AI
    //    writes one or more shards depending on the input size.
    const shards = await this.gcs.listJsonObjects(outputBucket, outputPrefix);
    if (shards.length === 0) {
      throw new OcrPermanentError(
        'empty_batch_output',
        `Batch job completed but no JSON shards under gs://${outputBucket}/${outputPrefix}`,
      );
    }
    return mapDocAiDocumentsToOcrOutput(shards, languages[0] ?? 'en');
  }

  private processorName(): string {
    const project = this.required('OCR_GCP_PROJECT_ID', this.config.ocrGcpProjectId);
    const location = this.required('OCR_GCP_LOCATION', this.config.ocrGcpLocation);
    const processor = this.required(
      'OCR_GCP_PROCESSOR_ID',
      this.config.ocrGcpProcessorId,
    );
    return this.client.processorPath(project, location, processor);
  }

  /**
   * Resolve the four pieces of the batch-IO contract:
   *   - input: `gs://{bucket}/ocr-input/{documentId}.pdf`
   *   - output: `gs://{bucket}/ocr-output/{documentId}/{timestamp}/`
   *
   * Bucket comes from `OCR_GCP_BATCH_OUTPUT_PREFIX` (env), which is the
   * `gs://bucket/prefix` URI of where we own a writable folder.
   */
  private batchLocations(documentId: string): {
    inputBucket: string;
    inputKey: string;
    outputBucket: string;
    outputPrefix: string;
  } {
    const root = this.required(
      'OCR_GCP_BATCH_OUTPUT_PREFIX',
      this.config.ocrGcpBatchOutputPrefix,
    );
    const match = /^gs:\/\/([^/]+)\/(.+?)\/?$/.exec(root);
    if (!match) {
      throw new OcrPermanentError(
        'invalid_batch_prefix',
        `OCR_GCP_BATCH_OUTPUT_PREFIX must be a 'gs://bucket/prefix' URI (got '${root}')`,
      );
    }
    const [, bucket, prefix] = match;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return {
      inputBucket: bucket,
      inputKey: `${prefix}/input/${documentId}.pdf`,
      outputBucket: bucket,
      outputPrefix: `${prefix}/output/${documentId}/${stamp}/`,
    };
  }

  private required(name: string, value: string | undefined): string {
    if (!value) {
      throw new OcrPermanentError(
        'missing_config',
        `${name} is required when OCR_DRIVER=google-document-ai`,
      );
    }
    return value;
  }

  /** Normalize SDK errors into the OCR-pipeline error taxonomy. */
  private mapError(err: unknown): Error {
    if (err instanceof OcrPermanentError || err instanceof OcrTransientError) {
      return err;
    }
    if (err instanceof Error) {
      const code = (err as { code?: number }).code;
      if (typeof code === 'number' && TRANSIENT_GRPC_CODES.has(code)) {
        return new OcrTransientError(err.message, err);
      }
      // INVALID_ARGUMENT or PERMISSION_DENIED — caller's input is wrong.
      return new OcrPermanentError('document_ai_error', err.message);
    }
    return new OcrPermanentError(
      'document_ai_error',
      typeof err === 'string' ? err : 'Unknown Document AI error',
    );
  }
}

async function readAllBytes(source: Readable): Promise<Uint8Array> {
  const chunks: Buffer[] = [];
  for await (const chunk of source) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  }
  return new Uint8Array(Buffer.concat(chunks));
}
