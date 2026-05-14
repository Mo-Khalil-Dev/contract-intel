import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';
import { DocumentId } from './document-id.vo';
import { DocumentType } from './document-type.vo';

interface StorageKeyProps {
  value: string;
}

/**
 * Opaque key used to address a file in the storage backend. Format:
 * `{documentId}.{ext}`. Intentionally does NOT contain user-facing data
 * (no original filename, no org id) — that lives on the Document row,
 * not in the URL surface.
 */
export class StorageKey extends ValueObject<StorageKeyProps> {
  private constructor(value: string) {
    super({ value });
  }

  /** Mint a fresh storage key for a new Document. */
  static forDocument(documentId: DocumentId, type: DocumentType): StorageKey {
    return new StorageKey(`${documentId.value}.${type.extension}`);
  }

  /** Rehydrate from persistence — validates shape but not the type. */
  static fromString(value: string): StorageKey {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new DomainException('INVALID_STORAGE_KEY', 'Storage key cannot be empty');
    }
    // Must look like `{uuid}.{ext}` — defence against accidental
    // overwrites and against persistence-layer corruption.
    if (!/^[0-9a-f-]{8,}\.[a-z0-9]+$/i.test(value)) {
      throw new DomainException(
        'INVALID_STORAGE_KEY',
        `Storage key '${value}' is not in the expected '{uuid}.{ext}' format`,
      );
    }
    return new StorageKey(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
