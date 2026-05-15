import { Injectable, Logger } from '@nestjs/common';
import { promises as fs, createWriteStream, createReadStream } from 'fs';
import { join, resolve } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { AppConfigService } from '../../../../config/app-config.service';
import { InfrastructureException } from '../../../../shared/exceptions/app-error';
import { DocumentType } from '../../domain/value-objects/document-type.vo';
import { StorageKey } from '../../domain/value-objects/storage-key.vo';
import { IStorageService, UploadUrlGrant } from '../../domain/ports/storage-service.port';

const UPLOAD_TTL_SECONDS = 60 * 15;

/**
 * Local-filesystem storage driver.
 *
 * `generateUploadUrl` returns a route on our own backend that the browser
 * PUTs to. `writeStream` then writes the bytes to disk. This way the
 * frontend code path is identical between local-dev (PUT to backend) and
 * prod-GCS (PUT to presigned GCS URL) — only the URL differs.
 *
 * Files land at `<LOCAL_STORAGE_PATH>/<storageKey>`.
 */
@Injectable()
export class LocalStorageDriver implements IStorageService {
  private readonly logger = new Logger(LocalStorageDriver.name);

  constructor(private readonly config: AppConfigService) {}

  /** Absolute filesystem dir under which all uploads live. */
  private get root(): string {
    return resolve(this.config.localStoragePath);
  }

  generateUploadUrl(key: StorageKey, _type: DocumentType): Promise<UploadUrlGrant> {
    // Same-origin URL the browser PUTs to. The Vite proxy in dev forwards
    // /api → backend:3000; in a deployed env this is hit directly.
    // No async work here (the GCS driver will await a presigned-URL call).
    const url = `/api/v1/documents/upload/raw/${encodeURIComponent(key.value)}`;
    const expiresAt = new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000);
    return Promise.resolve({ url, expiresAt, method: 'PUT' });
  }

  /**
   * Stream incoming request bytes to disk at `<root>/<storageKey>`.
   * Called by `DocumentController` when the browser PUTs to the raw route.
   *
   * Idempotent — overwrites are fine because the storageKey already
   * uniquely identifies the document.
   */
  async writeStream(key: StorageKey, source: Readable): Promise<{ bytesWritten: number }> {
    await fs.mkdir(this.root, { recursive: true });
    const target = join(this.root, key.value);

    // Guard against directory traversal — storageKey is validated by the
    // VO but defence in depth is cheap.
    if (!target.startsWith(this.root + '/') && target !== this.root) {
      throw new InfrastructureException(
        'INVALID_STORAGE_PATH',
        'Storage key resolves outside the upload root',
      );
    }

    const sink = createWriteStream(target);
    let bytesWritten = 0;
    source.on('data', (chunk: Buffer) => {
      bytesWritten += chunk.length;
    });

    try {
      await pipeline(source, sink);
    } catch (err) {
      this.logger.error(`[LocalStorage] write failed for ${key.value}`, err as Error);
      // Best-effort cleanup of partial file.
      await fs.unlink(target).catch(() => undefined);
      throw new InfrastructureException(
        'STORAGE_WRITE_FAILED',
        `Failed to write blob: ${(err as Error).message}`,
      );
    }

    this.logger.log(`[LocalStorage] wrote ${bytesWritten} bytes to ${target}`);
    return { bytesWritten };
  }

  async openReadStream(key: StorageKey): Promise<Readable> {
    const target = join(this.root, key.value);
    try {
      await fs.access(target);
    } catch {
      throw new InfrastructureException(
        'STORAGE_OBJECT_NOT_FOUND',
        `No object at storage key ${key.value}`,
      );
    }
    return createReadStream(target);
  }

  /** True if a file exists at the given key. */
  async exists(key: StorageKey): Promise<boolean> {
    try {
      await fs.access(join(this.root, key.value));
      return true;
    } catch {
      return false;
    }
  }
}
