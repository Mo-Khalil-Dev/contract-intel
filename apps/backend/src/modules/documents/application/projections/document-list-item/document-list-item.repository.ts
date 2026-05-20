import { DocumentListItem, DocumentListItemStatus } from './document-list-item.read-model';

export const DOCUMENT_LIST_ITEM_REPOSITORY = Symbol('DOCUMENT_LIST_ITEM_REPOSITORY');

/** Subset of DocumentListItem allowed when seeding a brand-new row. */
export type NewDocumentListItem = Pick<
  DocumentListItem,
  'id' | 'orgId' | 'name' | 'type' | 'status' | 'uploadedAt'
> &
  Partial<
    Pick<
      DocumentListItem,
      'counterparty' | 'terminationDate' | 'riskScore' | 'flagsRed' | 'flagsOrange' | 'flagsBlue' | 'hasUnlimitedLiability'
    >
  >;

/** Partial update — only the columns the projection handlers can mutate. */
export type DocumentListItemPatch = Partial<
  Pick<
    DocumentListItem,
    | 'name'
    | 'type'
    | 'counterparty'
    | 'riskScore'
    | 'flagsRed'
    | 'flagsOrange'
    | 'flagsBlue'
    | 'terminationDate'
    | 'status'
    | 'hasUnlimitedLiability'
  >
>;

export interface DocumentListFilters {
  /** Case-insensitive substring on `name`. */
  q?: string;
  /** Risk band — mapping to score range lives in a shared helper. */
  risk?: 'all' | 'high' | 'medium' | 'low';
  /** ContractType value, or 'all'. */
  type?: string;
  status?: DocumentListItemStatus | 'all';
}

export type DocumentListSort = 'risk' | 'date' | 'name';

export interface DocumentListPage {
  items: DocumentListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DocumentListSummary {
  totalContracts: number;
  analysed: number;
  /** Mean risk over analysed docs, 1 dp. 0 when there are no analysed docs. */
  avgRisk: number;
  /** Sum of red flags across analysed docs. */
  criticalFlags: number;
  /** Count of analysed docs with `hasUnlimitedLiability = true`. */
  unlimitedLiability: number;
}

/**
 * Read-side repository for the Document list projection.
 *
 * Writes are upserts/patches driven by domain event handlers — there is no
 * domain aggregate behind this table. Reads are scoped to `orgId` and
 * filtered/sorted/paginated server-side per Requirement 13 (US-PORT-5).
 */
export interface IDocumentListItemRepository {
  /** Upsert a new row at the start of a document's lifecycle. */
  insert(item: NewDocumentListItem): Promise<void>;

  /** Patch an existing row. No-op (and logs) if the row is missing. */
  update(id: string, patch: DocumentListItemPatch): Promise<void>;

  /** Hard-delete a row. Cascade from Document handles most cases. */
  remove(id: string): Promise<void>;

  /** Single-row lookup, scoped by orgId. */
  findById(id: string, orgId: string): Promise<DocumentListItem | null>;

  /** Paginated, filtered, sorted list. Honours US-PORT-2..5. */
  findAll(
    orgId: string,
    filters: DocumentListFilters,
    sort: DocumentListSort,
    page: number,
    pageSize: number,
  ): Promise<DocumentListPage>;

  /** Portfolio-wide summary for the KPI strip. Ignores filters. */
  summary(orgId: string): Promise<DocumentListSummary>;
}
