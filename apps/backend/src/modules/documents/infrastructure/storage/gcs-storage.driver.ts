import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Storage, type StorageOptions } from '@google-cloud/storage';
import { AppConfigService } from '../../../../config/app-config.service';
import { StorageDriver } from '../../../../config/environment-variables';
import { InfrastructureException } from '../../../../shared/exceptions/app-error';
import { DocumentType } from '../../domain/value-objects/document-type.vo';
import { StorageKey } from '../../domain/value-objects/storage-key.vo';
import { IStorageService, UploadUrlGrant } from '../../domain/ports/storage-service.port';

const UPLOAD_TTL_SECONDS = 60 * 15;

/**
 * Google Cloud Storage driver.
 *
 * Mints V4 presigned PUT URLs the browser uploads directly to — file
 * bytes never touch the backend in prod. The same code path that local
 * dev uses (browser PUT → uploadUrl) works here; only the URL differs.
 *
 * Configuration (env, validated at boot):
 *   GCS_PROJECT_ID            — your GCP project id
 *   GCS_BUCKET_NAME           — bucket the uploads land in
 *   GCS_SERVICE_ACCOUNT_KEY   — base64-encoded JSON key, or filesystem
 *                               path to the JSON file. If unset, falls
 *                               back to Application Default Credentials.
 *
 * Bucket setup (one-off): see scripts/setup-gcs.sh.
 */
@Injectable()
export class GcsStorageDriver implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(GcsStorageDriver.name);
  private storage!: Storage;
  private bucketName!: string;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    // Skip init entirely when not in gcs mode. We're still instantiated
    // by Nest's DI graph (the factory needs both drivers available for
    // the choice), but local mode shouldn't require GCS env vars.
    if (this.config.storageDriver !== StorageDriver.Gcs) {
      this.logger.debug('[GcsStorage] skipped init (STORAGE_DRIVER != gcs)');
      return;
    }

    const projectId = this.config.gcsProjectId;
    const bucket = this.config.gcsBucketName;

    if (!projectId || !bucket) {
      throw new InfrastructureException(
        'GCS_CONFIG_MISSING',
        'GCS_PROJECT_ID and GCS_BUCKET_NAME must be set when STORAGE_DRIVER=gcs',
      );
    }

    this.bucketName = bucket;
    this.storage = new Storage(this.resolveCredentials(projectId));

    this.logger.log(
      `[GcsStorage] initialised. project=${projectId} bucket=${bucket}`,
    );
  }

  /**
   * Decide which credentials path to use based on what's in env:
   *   1. GCS_SERVICE_ACCOUNT_KEY = base64 JSON   → decode + parse + use directly
   *   2. GCS_SERVICE_ACCOUNT_KEY = filesystem path → pass `keyFilename`
   *   3. nothing                                  → Application Default
   *      Credentials (gcloud auth on a dev box, workload identity on GCE)
   */
  private resolveCredentials(projectId: string): StorageOptions {
    const raw = this.config.gcsServiceAccountKey;
    if (!raw) {
      this.logger.log('[GcsStorage] no service account key set; using ADC');
      return { projectId };
    }

    // Heuristic: a base64 service account JSON contains a `client_email`
    // field once decoded. If raw decodes cleanly and parses to JSON,
    // it's an inline key; otherwise treat it as a path.
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      const credentials = JSON.parse(decoded) as { client_email?: string };
      if (credentials && typeof credentials.client_email === 'string') {
        this.logger.log('[GcsStorage] using inline base64 service account key');
        return { projectId, credentials };
      }
    } catch {
      // Not base64 JSON; fall through to path.
    }

    this.logger.log(`[GcsStorage] using service account file at ${raw}`);
    return { projectId, keyFilename: raw };
  }

  async generateUploadUrl(key: StorageKey, type: DocumentType): Promise<UploadUrlGrant> {
    const file = this.storage.bucket(this.bucketName).file(key.value);
    const expiresAt = new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000);
    try {
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: expiresAt,
        contentType:
          (type.value as string) === 'PDF' ? 'application/pdf' : 'application/octet-stream',
      });
      return { url, expiresAt, method: 'PUT' };
    } catch (err) {
      this.logger.error(
        `[GcsStorage] failed to mint presigned URL for ${key.value}`,
        err as Error,
      );
      throw new InfrastructureException(
        'GCS_PRESIGN_FAILED',
        `Could not mint upload URL: ${(err as Error).message}`,
      );
    }
  }

  /** Verify a file exists in the bucket — useful for /complete to
   *  defend against the frontend lying about a successful PUT. */
  async exists(key: StorageKey): Promise<boolean> {
    const [exists] = await this.storage.bucket(this.bucketName).file(key.value).exists();
    return exists;
  }
}
