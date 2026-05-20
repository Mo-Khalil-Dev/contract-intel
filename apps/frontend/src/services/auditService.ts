import { httpService } from '@/api/httpService';
import { API } from '@/api/endpoints';
import { unwrap } from '@/api/unwrap';
import type {
  AuditEventsResponse,
  AuditFilters,
  AuditExportResponse,
} from '@/types/audit';

/**
 * Audit service — wraps the /audit API endpoints.
 * Follows the 3-tier stack: hook → service → httpService → axios.
 */
export const auditService = {
  /**
   * Fetch a paginated, filtered list of audit events.
   */
  getAuditEvents(filters?: AuditFilters): Promise<AuditEventsResponse> {
    return httpService
      .get<AuditEventsResponse>(API.AUDIT.LIST, { params: filters })
      .then(unwrap);
  },

  /**
   * Export the audit log as JSON or CSV.
   * Page/pageSize are excluded — the export covers the full filtered set.
   */
  exportAuditLog(
    format: 'json' | 'csv',
    filters?: Omit<AuditFilters, 'page' | 'pageSize'>,
  ): Promise<AuditExportResponse> {
    return httpService
      .get<AuditExportResponse>(API.AUDIT.EXPORT, { params: { format, ...filters } })
      .then(unwrap);
  },
};
