import { QueryType } from '../../domain/query-type';

/**
 * A grounded slice of the user's portfolio, assembled per query type by
 * the {@link ContextBuilder} from already-extracted data (Phases 10/11).
 * This is the ONLY material the LLM is allowed to reason over — every
 * citation is validated back against these items (Task 12.2).
 *
 * MVP ships the risk slice. Other query types populate the same shape
 * with type-appropriate items in Task 12.9.
 */

/** A single contract row the answer may cite. `ref` is the citation key. */
export interface PortfolioContextItem {
  /** Stable citation reference, e.g. "doc:<id>". Cited as [1], [2] … by index. */
  ref: string;
  documentId: string;
  title: string;
  type: string;
  counterparty: string;
  riskScore: number | null;
  riskBand: 'high' | 'medium' | 'low' | 'unknown';
  flagsRed: number;
  flagsOrange: number;
  flagsBlue: number;
  hasUnlimitedLiability: boolean;
  terminationDate: string | null;
}

export interface PortfolioSummary {
  totalContracts: number;
  analysed: number;
  avgRisk: number;
  criticalFlags: number;
  unlimitedLiability: number;
}

export interface PortfolioContext {
  queryType: QueryType;
  question: string;
  summary: PortfolioSummary;
  items: PortfolioContextItem[];
}
