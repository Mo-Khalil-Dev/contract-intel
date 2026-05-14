import { DocumentType } from '../value-objects/document-type.vo';
import { StorageKey } from '../value-objects/storage-key.vo';

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface UploadUrlGrant {
  /** The URL the browser will PUT the file bytes to. May be a presigned
   *  GCS URL (prod) or a backend-proxied route (dev). */
  url: string;
  /** When the URL stops being valid. The Document remains in 'uploading'
   *  status; if completeUpload doesn't arrive before this, the upload is
   *  considered abandoned. */
  expiresAt: Date;
  /** HTTP method to use for the upload. PUT for both GCS and our local
   *  backend-proxied route. Kept explicit so the client doesn't have to
   *  guess. */
  method: 'PUT';
}

/**
 * Outbound port to the file-storage backend.
 *
 * Two implementations live in Task 5.4: a `LocalStorageDriver` (real,
 * writes to apps/backend/uploads/ for dev) and a `GcsStorageDriver`
 * (stub — interface-compliant but throws NotImplementedError until
 * actual deployment).
 *
 * The aggregate doesn't know which one is running — it just asks for a
 * URL.
 */
export interface IStorageService {
  /**
   * Mint a one-time URL the browser can PUT to for this storage key.
   * Implementations decide their own URL format and TTL.
   */
  generateUploadUrl(
    key: StorageKey,
    contentType: DocumentType,
  ): Promise<UploadUrlGrant>;
}
