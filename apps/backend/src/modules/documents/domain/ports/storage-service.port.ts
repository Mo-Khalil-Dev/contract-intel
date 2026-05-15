import type { Readable } from 'stream';
import { DocumentType } from '../value-objects/document-type.vo';
import { StorageKey } from '../value-objects/storage-key.vo';

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface UploadUrlGrant {
  /** The URL the browser will PUT the file bytes to. Always a backend
   *  route in the current architecture — every byte flows through our
   *  perimeter for inspection / audit / future content scanning. */
  url: string;
  /** When the URL stops being valid. The Document remains in 'uploading'
   *  status; if completeUpload doesn't arrive before this, the upload is
   *  considered abandoned. */
  expiresAt: Date;
  /** HTTP method to use for the upload. PUT in v1. Kept explicit so the
   *  client doesn't have to guess. */
  method: 'PUT';
}

/**
 * Outbound port to the file-storage backend.
 *
 * Architecture (chosen 2026-05-14): **backend-proxied uploads**. The
 * browser always PUTs to our backend, never directly to cloud storage.
 * Trade-offs: bytes pass through our perimeter (scannable, auditable,
 * encryptable under our own key); backend bears the streaming cost.
 *
 * Implementations:
 *   - `LocalStorageDriver` — writes to `apps/backend/uploads/`
 *   - `GcsStorageDriver`   — streams bytes to a GCS bucket via the
 *     authenticated SDK
 *
 * Both expose the same two methods.
 */
export interface IStorageService {
  /**
   * Mint a URL for the browser to PUT bytes to. In the current
   * backend-proxied architecture, this is always a route on *this*
   * backend (`/api/v1/documents/upload/raw/:storageKey`). The
   * implementation behind that route depends on the storage driver.
   */
  generateUploadUrl(
    key: StorageKey,
    contentType: DocumentType,
  ): Promise<UploadUrlGrant>;

  /**
   * Persist a stream of bytes under `key`. Called by the controller's
   * raw PUT route. Returns the byte count actually written so the caller
   * can sanity-check against the declared file size.
   */
  writeStream(
    key: StorageKey,
    source: Readable,
    contentType?: string,
  ): Promise<{ bytesWritten: number }>;

  /**
   * Open a readable stream of the bytes stored under `key`. Used by the
   * Phase 7 OCR pipeline to feed the PDF into pdfjs / Document AI.
   * Throws if the object doesn't exist.
   */
  openReadStream(key: StorageKey): Promise<Readable>;
}
