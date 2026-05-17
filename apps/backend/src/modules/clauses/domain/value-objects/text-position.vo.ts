import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface TextPositionProps {
  startOffset: number;
  endOffset: number;
  pageNumber: number;
}

export class TextPosition extends ValueObject<TextPositionProps> {
  private constructor(props: TextPositionProps) {
    super(props);
  }

  static create(params: {
    startOffset: number;
    endOffset: number;
    pageNumber: number;
  }): TextPosition {
    const { startOffset, endOffset, pageNumber } = params;

    if (!Number.isInteger(startOffset) || !Number.isInteger(endOffset)) {
      throw new DomainException(
        'INVALID_TEXT_POSITION',
        `Offsets must be integers (got start=${startOffset}, end=${endOffset})`,
      );
    }
    if (startOffset < 0) {
      throw new DomainException(
        'INVALID_TEXT_POSITION',
        `startOffset must be ≥ 0 (got ${startOffset})`,
      );
    }
    if (endOffset <= startOffset) {
      throw new DomainException(
        'INVALID_TEXT_POSITION',
        `endOffset must be > startOffset (got start=${startOffset}, end=${endOffset})`,
      );
    }
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw new DomainException(
        'INVALID_TEXT_POSITION',
        `pageNumber must be a positive integer (got ${pageNumber})`,
      );
    }

    return new TextPosition({ startOffset, endOffset, pageNumber });
  }

  get startOffset(): number {
    return this.props.startOffset;
  }
  get endOffset(): number {
    return this.props.endOffset;
  }
  get pageNumber(): number {
    return this.props.pageNumber;
  }
  get length(): number {
    return this.props.endOffset - this.props.startOffset;
  }
}
