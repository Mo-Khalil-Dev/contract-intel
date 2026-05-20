import type { DocumentListFilters } from '@/lib/documentListFilters/defaults';
import styles from './FilterStrip.module.css';

interface FilterStripProps {
  filters: DocumentListFilters;
  onQueryChange: (q: string) => void;
  onFilterChange: (patch: Partial<DocumentListFilters>) => void;
}

export function FilterStrip({ filters, onQueryChange, onFilterChange }: FilterStripProps) {
  return (
    <div className={styles.strip} role="search" aria-label="Filter contracts">
      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search contracts…"
          value={filters.q}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search by contract name"
        />
      </div>

      <select
        className={styles.select}
        value={filters.risk}
        onChange={(e) => onFilterChange({ risk: e.target.value as DocumentListFilters['risk'] })}
        aria-label="Filter by risk"
      >
        <option value="all">All risk</option>
        <option value="high">High risk</option>
        <option value="medium">Medium risk</option>
        <option value="low">Low risk</option>
      </select>

      <select
        className={styles.select}
        value={filters.type}
        onChange={(e) => onFilterChange({ type: e.target.value as DocumentListFilters['type'] })}
        aria-label="Filter by type"
      >
        <option value="all">All types</option>
        <option value="vendor">Vendor</option>
        <option value="license">License</option>
        <option value="partnership">Partnership</option>
        <option value="customer">Customer</option>
        <option value="lease">Lease</option>
        <option value="nda">NDA</option>
        <option value="other">Other</option>
      </select>

      <select
        className={styles.select}
        value={filters.sort}
        onChange={(e) => onFilterChange({ sort: e.target.value as DocumentListFilters['sort'] })}
        aria-label="Sort by"
      >
        <option value="risk">Sort: Risk</option>
        <option value="date">Sort: Date</option>
        <option value="name">Sort: Name</option>
      </select>
    </div>
  );
}
