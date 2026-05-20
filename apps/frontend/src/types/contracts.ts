export type DocumentListItemStatus = 'complete' | 'processing' | 'failed';

export interface DocumentListItem {
  id: string;
  orgId: string;
  name: string;
  type: string;
  counterparty: string;
  riskScore: number | null;
  flagsRed: number;
  flagsOrange: number;
  flagsBlue: number;
  terminationDate: string | null; // ISO 8601 date string
  status: DocumentListItemStatus;
  uploadedAt: string; // ISO 8601
  hasUnlimitedLiability: boolean;
  updatedAt: string; // ISO 8601
}

export interface DocumentListSummary {
  totalContracts: number;
  analysed: number;
  avgRisk: number;
  criticalFlags: number;
  unlimitedLiability: number;
}

export interface DocumentListResponse {
  items: DocumentListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: DocumentListSummary;
}
