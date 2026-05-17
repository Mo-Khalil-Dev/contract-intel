import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

/**
 * Document-level metadata extracted by the same Claude call that produces
 * clauses. Lives on the ExtractionRun aggregate so re-extraction produces
 * a versioned snapshot — old runs retain their original metadata.
 *
 * All fields are optional freeform strings. Claude returns text exactly
 * as it appears in the contract (e.g. "Net 30 days", "£50,000", "30 days
 * prior written notice"). We do NOT parse into typed money/date objects
 * in Phase 8 — that's a Phase 9+ enrichment if a use case needs it.
 *
 * Field names match the wireframe (clause-extraction-design.md screens).
 */

export interface PartyEntry {
  /** Role in the contract — "Provider", "Client", "Vendor", "Buyer", etc. */
  role: string;
  /** Legal name as it appears in the document. */
  name: string;
}

interface ContractMetadataProps {
  contractType: string | null;
  parties: PartyEntry[];
  effectiveDate: string | null;
  terminationDate: string | null;
  noticePeriod: string | null;
  autoRenewal: string | null;
  paymentAmount: string | null;
  currency: string | null;
  paymentSchedule: string | null;
  priceEscalation: string | null;
  paymentTerms: string | null;
}

const MAX_PARTIES = 10;
const MAX_FIELD_LEN = 500;

export class ContractMetadata extends ValueObject<ContractMetadataProps> {
  private constructor(props: ContractMetadataProps) {
    super(props);
  }

  static create(input: Partial<ContractMetadataProps>): ContractMetadata {
    const parties = input.parties ?? [];
    if (parties.length > MAX_PARTIES) {
      throw new DomainException(
        'INVALID_CONTRACT_METADATA',
        `parties exceeds ${MAX_PARTIES} (got ${parties.length})`,
      );
    }
    for (const [i, p] of parties.entries()) {
      if (
        typeof p.role !== 'string' ||
        typeof p.name !== 'string' ||
        p.role.length === 0 ||
        p.name.length === 0
      ) {
        throw new DomainException(
          'INVALID_CONTRACT_METADATA',
          `parties[${i}] must have non-empty role and name`,
        );
      }
      if (p.role.length > MAX_FIELD_LEN || p.name.length > MAX_FIELD_LEN) {
        throw new DomainException(
          'INVALID_CONTRACT_METADATA',
          `parties[${i}] role or name exceeds ${MAX_FIELD_LEN} chars`,
        );
      }
    }

    const optional: (keyof ContractMetadataProps)[] = [
      'contractType',
      'effectiveDate',
      'terminationDate',
      'noticePeriod',
      'autoRenewal',
      'paymentAmount',
      'currency',
      'paymentSchedule',
      'priceEscalation',
      'paymentTerms',
    ];
    for (const key of optional) {
      const v = input[key as keyof typeof input];
      if (v != null && typeof v !== 'string') {
        throw new DomainException(
          'INVALID_CONTRACT_METADATA',
          `${key} must be a string or null (got ${typeof v})`,
        );
      }
      if (typeof v === 'string' && v.length > MAX_FIELD_LEN) {
        throw new DomainException(
          'INVALID_CONTRACT_METADATA',
          `${key} exceeds ${MAX_FIELD_LEN} chars`,
        );
      }
    }

    return new ContractMetadata({
      contractType: (input.contractType) ?? null,
      parties,
      effectiveDate: (input.effectiveDate) ?? null,
      terminationDate: (input.terminationDate) ?? null,
      noticePeriod: (input.noticePeriod) ?? null,
      autoRenewal: (input.autoRenewal) ?? null,
      paymentAmount: (input.paymentAmount) ?? null,
      currency: (input.currency) ?? null,
      paymentSchedule: (input.paymentSchedule) ?? null,
      priceEscalation: (input.priceEscalation) ?? null,
      paymentTerms: (input.paymentTerms) ?? null,
    });
  }

  /** Empty metadata — used when Claude returns no metadata for a doc. */
  static empty(): ContractMetadata {
    return ContractMetadata.create({});
  }

  get contractType() { return this.props.contractType; }
  get parties() { return this.props.parties; }
  get effectiveDate() { return this.props.effectiveDate; }
  get terminationDate() { return this.props.terminationDate; }
  get noticePeriod() { return this.props.noticePeriod; }
  get autoRenewal() { return this.props.autoRenewal; }
  get paymentAmount() { return this.props.paymentAmount; }
  get currency() { return this.props.currency; }
  get paymentSchedule() { return this.props.paymentSchedule; }
  get priceEscalation() { return this.props.priceEscalation; }
  get paymentTerms() { return this.props.paymentTerms; }

  toJSON(): ContractMetadataProps {
    return { ...this.props };
  }
}
