import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

export enum OcrDriverValue {
  NATIVE_PDF = 'native_pdf',
  GOOGLE_DOCUMENT_AI = 'google_document_ai',
  MOCK = 'mock',
  // Document-level only — emitted by ClassifierThenRouter when pages
  // span multiple per-page drivers. Never used at the page level.
  HYBRID = 'hybrid',
}

interface OcrDriverProps {
  value: OcrDriverValue;
}

export class OcrDriver extends ValueObject<OcrDriverProps> {
  private constructor(value: OcrDriverValue) {
    super({ value });
  }

  static fromValue(value: string): OcrDriver {
    const match = Object.values(OcrDriverValue).find((d) => (d as string) === value);
    if (!match) {
      throw new DomainException(
        'INVALID_OCR_DRIVER',
        `OCR driver must be one of ${Object.values(OcrDriverValue).join(', ')} (got '${value}')`,
      );
    }
    return new OcrDriver(match);
  }

  static nativePdf(): OcrDriver {
    return new OcrDriver(OcrDriverValue.NATIVE_PDF);
  }
  static googleDocumentAi(): OcrDriver {
    return new OcrDriver(OcrDriverValue.GOOGLE_DOCUMENT_AI);
  }
  static mock(): OcrDriver {
    return new OcrDriver(OcrDriverValue.MOCK);
  }
  static hybrid(): OcrDriver {
    return new OcrDriver(OcrDriverValue.HYBRID);
  }

  get value(): OcrDriverValue {
    return this.props.value;
  }

  isPageLevel(): boolean {
    return this.props.value !== OcrDriverValue.HYBRID;
  }
}
