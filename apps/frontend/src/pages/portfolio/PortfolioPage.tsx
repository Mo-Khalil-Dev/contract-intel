import { useNavigate } from 'react-router-dom';
import { useDocumentList } from '@/hooks/useDocumentList';
import { useDocumentListFilters } from '@/lib/documentListFilters/useDocumentListFilters';
import { KpiStrip } from './components/KpiStrip';
import { FilterStrip } from './components/FilterStrip';
import { ContractsTable } from './components/ContractsTable';
import { Pagination } from './components/Pagination';
import styles from './PortfolioPage.module.css';

export function PortfolioPage() {
  const navigate = useNavigate();
  const { filters, setFilters, setQueryText } = useDocumentListFilters();
  const { items, total, page, pageSize, totalPages, summary, isLoading, isFetching, error, refetch } =
    useDocumentList(filters);

  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Contracts</h1>
            <p className={styles.subtitle}>Your full contract portfolio</p>
          </div>
          <div className={styles.actions}>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
              onClick={() => navigate('/upload')}
            >
              Upload
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <KpiStrip summary={summary} isLoading={isLoading} />
        </div>

        <div className={styles.section}>
          <FilterStrip
            filters={filters}
            onQueryChange={setQueryText}
            onFilterChange={setFilters}
          />
        </div>

        <div className={styles.section}>
          <ContractsTable
            items={items}
            total={total}
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            onRetry={refetch}
          />
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={(p) => setFilters({ page: p })}
        />
      </div>
    </div>
  );
}
