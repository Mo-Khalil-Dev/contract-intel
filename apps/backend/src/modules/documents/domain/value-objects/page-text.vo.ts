import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';
import { ConfidenceScore } from './confidence-score.vo';
import { TextQualityScore } from './text-quality-score.vo';
import { OcrDriver, OcrDriverValue } from './ocr-driver.vo';

interface PageTextProps {
  pageNumber: number;
  text: string;
  confidence: ConfidenceScore;
  textQualityScore: TextQualityScore;
  driver: OcrDriver;
}

export class PageText extends ValueObject<PageTextProps> {
  private constructor(props: PageTextProps) {
    super(props);
  }

  static create(params: {
    pageNumber: number;
    text: string;
    confidence: ConfidenceScore;
    textQualityScore: TextQualityScore;
    driver: OcrDriver;
  }): PageText {
    if (!Number.isInteger(params.pageNumber) || params.pageNumber < 1) {
      throw new DomainException(
        'INVALID_PAGE_NUMBER',
        `Page number must be a positive integer (got ${params.pageNumber})`,
      );
    }
    if (typeof params.text !== 'string') {
      throw new DomainException(
        'INVALID_PAGE_TEXT',
        `Page text must be a string (got ${typeof params.text})`,
      );
    }
    if (params.driver.value === OcrDriverValue.HYBRID) {
      throw new DomainException(
        'INVALID_PAGE_DRIVER',
        `Page-level driver cannot be 'hybrid' — hybrid is document-level only`,
      );
    }
    return new PageText(params);
  }

  get pageNumber(): number {
    return this.props.pageNumber;
  }
  get text(): string {
    return this.props.text;
  }
  get confidence(): ConfidenceScore {
    return this.props.confidence;
  }
  get textQualityScore(): TextQualityScore {
    return this.props.textQualityScore;
  }
  get driver(): OcrDriver {
    return this.props.driver;
  }

  get charCount(): number {
    return this.props.text.length;
  }
}
