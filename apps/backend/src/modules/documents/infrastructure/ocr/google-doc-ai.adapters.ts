import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { AppConfigService } from '../../../../config/app-config.service';
import { DocAiDocument } from './document-ai-response.mapper';
import {
  BatchMetadata,
  DocAiClient,
  GcsBucketHelpers,
} from './google-doc-ai.driver';
import { InfrastructureException } from '../../../../shared/exceptions/app-error';

/**
 * Lazy-loaded wrapper around `@google-cloud/documentai`.
 *
 * The SDK is heavyweight (>5 MB transitive deps); we instantiate the
 * underlying `DocumentProcessorServiceClient` on first call so test runs
 * — which mock this whole adapter — never touch the SDK.
 *
 * Why the indirection? `DocumentProcessorServiceClient` returns LROs
 * with a `.promise()` method that polls until done; we expose just that
 * surface so the driver can be tested against a tiny stub instead of
 * the full SDK type tree.
 */
interface BatchOperation {
  promise(): Promise<[{ metadata?: BatchMetadata | null }]>;
}

interface RawSdkClient {
  processDocument(req: unknown): Promise<[{ document?: DocAiDocument }]>;
  batchProcessDocuments(req: unknown): Promise<[BatchOperation]>;
}

interface SdkModule {
  DocumentProcessorServiceClient: new (opts: {
    projectId?: string;
    keyFilename?: string;
    apiEndpoint?: string;
  }) => RawSdkClient;
}

@Injectable()
export class GoogleDocAiSdkClient implements DocAiClient, OnModuleInit {
  private readonly logger = new Logger(GoogleDocAiSdkClient.name);
  private sdkClient: RawSdkClient | null = null;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    // Construction is deferred to first use; OnModuleInit only logs the
    // driver mode so it's obvious from boot logs what's active.
    this.logger.log(
      `Document AI client armed (project=${this.config.ocrGcpProjectId ?? '<unset>'} location=${this.config.ocrGcpLocation ?? '<unset>'})`,
    );
  }

  private getClient(): RawSdkClient {
    if (this.sdkClient) return this.sdkClient;
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const docai = require('@google-cloud/documentai') as SdkModule;

    // Document AI uses the regional endpoint scheme — `eu-documentai...`
    // for `eu`, `us-documentai...` for `us`, etc.
    const location = this.config.ocrGcpLocation;
    const apiEndpoint =
      location && location !== 'global'
        ? `${location}-documentai.googleapis.com`
        : undefined;

    this.sdkClient = new docai.DocumentProcessorServiceClient({
      projectId: this.config.ocrGcpProjectId,
      keyFilename: this.config.gcsServiceAccountKey,
      apiEndpoint,
    });
    return this.sdkClient;
  }

  processorPath(project: string, location: string, processor: string): string {
    // Synchronous shape needed by the driver. We can build the resource
    // name ourselves — its format is stable and documented.
    return `projects/${project}/locations/${location}/processors/${processor}`;
  }

  processDocument(req: unknown): Promise<[{ document?: DocAiDocument }]> {
    return this.getClient().processDocument(req);
  }

  batchProcessDocuments(req: unknown): Promise<[BatchOperation]> {
    return this.getClient().batchProcessDocuments(req);
  }
}

/**
 * GCS helpers used by the batch path — kept inside the driver's module
 * boundary so the `IStorageService` port stays focused on the user's
 * upload bucket and isn't widened with OCR-specific list/readJson methods.
 */
@Injectable()
export class GoogleDocAiGcsHelpers implements GcsBucketHelpers {
  private readonly logger = new Logger(GoogleDocAiGcsHelpers.name);
  private storage: Storage | null = null;

  constructor(private readonly config: AppConfigService) {}

  private get client(): Storage {
    if (this.storage) return this.storage;
    this.storage = new Storage({
      projectId: this.config.ocrGcpProjectId ?? this.config.gcsProjectId,
      keyFilename: this.config.gcsServiceAccountKey,
    });
    return this.storage;
  }

  async uploadBytes(bucket: string, key: string, bytes: Uint8Array): Promise<void> {
    await this.client.bucket(bucket).file(key).save(Buffer.from(bytes), {
      resumable: false,
      metadata: { contentType: 'application/pdf' },
    });
    this.logger.log(`[DocAI] uploaded ${bytes.length} bytes to gs://${bucket}/${key}`);
  }

  async listJsonObjects(bucket: string, prefix: string): Promise<DocAiDocument[]> {
    const [files] = await this.client.bucket(bucket).getFiles({ prefix });
    if (files.length === 0) return [];
    const jsons = files.filter((f) => f.name.endsWith('.json'));
    const docs: DocAiDocument[] = [];
    for (const f of jsons) {
      const [buf] = await f.download();
      let parsed: unknown;
      try {
        parsed = JSON.parse(buf.toString('utf-8'));
      } catch (err) {
        throw new InfrastructureException(
          'CORRUPT_OCR_SHARD',
          `Failed to parse Document AI shard gs://${bucket}/${f.name}: ${(err as Error).message}`,
        );
      }
      // Cast across the trust boundary. The mapper validates field-by-field
      // when slicing; a malformed shard fails there with a clear error.
      docs.push(parsed as DocAiDocument);
    }
    this.logger.log(
      `[DocAI] read ${docs.length} shard(s) from gs://${bucket}/${prefix}`,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- explicit cast above
    return docs;
  }
}
