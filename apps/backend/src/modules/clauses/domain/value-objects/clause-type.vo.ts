import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

export enum ClauseTypeValue {
  INDEMNIFICATION = 'indemnification',
  LIMITATION_OF_LIABILITY = 'limitation_of_liability',
  TERMINATION = 'termination',
  GOVERNING_LAW = 'governing_law',
  DISPUTE_RESOLUTION = 'dispute_resolution',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  CONFIDENTIALITY = 'confidentiality',
  PAYMENT_TERMS = 'payment_terms',
  REPRESENTATIONS_WARRANTIES = 'representations_warranties',
  FORCE_MAJEURE = 'force_majeure',
  ASSIGNMENT = 'assignment',
  CHANGE_OF_CONTROL = 'change_of_control',
  NON_COMPETE = 'non_compete',
  DATA_PROTECTION = 'data_protection',
  OTHER = 'other',
}

interface ClauseTypeProps {
  value: ClauseTypeValue;
}

export class ClauseType extends ValueObject<ClauseTypeProps> {
  private constructor(value: ClauseTypeValue) {
    super({ value });
  }

  static fromValue(value: string): ClauseType {
    const match = Object.values(ClauseTypeValue).find((v) => (v as string) === value);
    if (!match) {
      throw new DomainException(
        'INVALID_CLAUSE_TYPE',
        `Clause type must be one of ${Object.values(ClauseTypeValue).join(', ')} (got '${value}')`,
      );
    }
    return new ClauseType(match);
  }

  get value(): ClauseTypeValue {
    return this.props.value;
  }
}
