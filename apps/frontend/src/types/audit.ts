export interface AuditEventDto {
  id: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  checksum: string;
  sequenceNumber: number;
  timestamp: string; // ISO 8601
  metadata?: Record<string, unknown> | null;
}

export interface AuditEventsResponse {
  events: AuditEventDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditFilters {
  actorId?: string;
  action?: string;
  resourceId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditExportResponse {
  content: string;
  filename: string;
  mimeType: string;
}
