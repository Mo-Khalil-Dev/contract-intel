import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

export enum DocumentTypeValue {
  PDF = 'PDF',
  // DOCX, PPTX deferred until the extraction pipeline is ready for them.
}

interface DocumentTypeProps {
  value: DocumentTypeValue;
}

const MIME_TO_TYPE: Record<string, DocumentTypeValue> = {
  'application/pdf': DocumentTypeValue.PDF,
};

const EXTENSION_TO_TYPE: Record<string, DocumentTypeValue> = {
  pdf: DocumentTypeValue.PDF,
};

export class DocumentType extends ValueObject<DocumentTypeProps> {
  private constructor(value: DocumentTypeValue) {
    super({ value });
  }

  static fromValue(value: string): DocumentType {
    const match = Object.values(DocumentTypeValue).find((t) => (t as string) === value);
    if (!match) {
      throw new DomainException(
        'INVALID_DOCUMENT_TYPE',
        `Document type must be one of ${Object.values(DocumentTypeValue).join(', ')} (got '${value}')`,
      );
    }
    return new DocumentType(match);
  }

  /** Infer the type from a MIME string (e.g. 'application/pdf'). */
  static fromMimeType(mime: string): DocumentType {
    const type = MIME_TO_TYPE[mime.toLowerCase()];
    if (!type) {
      throw new DomainException(
        'INVALID_DOCUMENT_TYPE',
        `Unsupported MIME type: ${mime}. Supported: ${Object.keys(MIME_TO_TYPE).join(', ')}`,
      );
    }
    return new DocumentType(type);
  }

  /** Infer the type from a filename's extension. Case-insensitive. */
  static fromFilename(filename: string): DocumentType {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const type = EXTENSION_TO_TYPE[ext];
    if (!type) {
      throw new DomainException(
        'INVALID_DOCUMENT_TYPE',
        `Unsupported file extension '.${ext}'. Supported: ${Object.keys(EXTENSION_TO_TYPE)
          .map((e) => `.${e}`)
          .join(', ')}`,
      );
    }
    return new DocumentType(type);
  }

  get value(): DocumentTypeValue {
    return this.props.value;
  }

  /** Lowercase extension for storage keys, e.g. 'pdf'. */
  get extension(): string {
    return this.props.value.toLowerCase();
  }
}
