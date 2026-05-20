import type { AuditEventDto, AuditFilters } from '@/types/audit';
import { useAuditLogTable } from './useAuditLogTable';
import styles from './AuditLogTable.module.css';

interface AuditLogTableProps {
  events: AuditEventDto[];
  isLoading: boolean;
  filters: AuditFilters;
  page: number;
  totalPages: number;
  total: number;
  setFilters: (partial: Omit<AuditFilters, 'page' | 'pageSize'>) => void;
  setPage: (page: number) => void;
  onRowClick: (event: AuditEventDto) => void;
}

export function AuditLogTable(props: AuditLogTableProps) {
  const { events, isLoading, filters, page, totalPages, total } = props;
  const {
    handleActorIdChange, handleActionChange, handleFromDateChange, handleToDateChange,
    handleRowClick, handleRowKeyDown, canGoPrev, canGoNext, setPage, formatTimestamp,
  } = useAuditLogTable(props);

  return (
    <div className={styles.root}>
      <div className={styles.filterBar} role="search" aria-label="Filter audit events">
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-actor">Actor ID</label>
          <input id="filter-actor" className={styles.filterInput} type="text"
            placeholder="e.g. user-123" value={filters.actorId ?? ''}
            onChange={handleActorIdChange} aria-label="Filter by actor ID" />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-action">Action</label>
          <input id="filter-action" className={styles.filterInput} type="text"
            placeholder="e.g. CONTRACT_APPROVED" value={filters.action ?? ''}
            onChange={handleActionChange} aria-label="Filter by action" />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-from">From date</label>
          <input id="filter-from" className={styles.filterInput} type="date"
            value={filters.fromDate ?? ''} onChange={handleFromDateChange} aria-label="From date" />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-to">To date</label>
          <input id="filter-to" className={styles.filterInput} type="date"
            value={filters.toDate ?? ''} onChange={handleToDateChange} aria-label="To date" />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="Audit log events" aria-busy={isLoading}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th} scope="col">Timestamp</th>
              <th className={styles.th} scope="col">Actor</th>
              <th className={styles.th} scope="col">Action</th>
              <th className={styles.th} scope="col">Resource</th>
              <th className={styles.th} scope="col">Seq #</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && events.length === 0 && (
              <tr><td colSpan={5} className={styles.empty}>No audit events found.</td></tr>
            )}
            {events.map((ev) => (
              <tr key={ev.id} className={styles.tr} tabIndex={0}
                onClick={() => handleRowClick(ev)} onKeyDown={(e) => handleRowKeyDown(e, ev)}
                aria-label={`Audit event: ${ev.action} by ${ev.actorId}`}>
                <td className={styles.td}>{formatTimestamp(ev.timestamp)}</td>
                <td className={`${styles.td} ${styles.tdMono}`}>{ev.actorId}</td>
                <td className={styles.td}><span className={styles.actionBadge}>{ev.action}</span></td>
                <td className={`${styles.td} ${styles.tdMono}`}>{ev.resourceType}/{ev.resourceId}</td>
                <td className={`${styles.td} ${styles.tdMono}`}>{ev.sequenceNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Pagination">
          <span className={styles.pageInfo}>
            Page {page} of {totalPages} ({total} events)
          </span>
          <button className={styles.pageBtn} onClick={() => setPage(page - 1)}
            disabled={!canGoPrev} aria-label="Previous page">‹</button>
          <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}
            aria-current="page" aria-label={`Page ${page}`}>{page}</button>
          <button className={styles.pageBtn} onClick={() => setPage(page + 1)}
            disabled={!canGoNext} aria-label="Next page">›</button>
        </nav>
      )}
    </div>
  );
}
