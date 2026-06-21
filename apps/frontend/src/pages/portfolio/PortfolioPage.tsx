import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentList } from '@/hooks/useDocumentList';
import { useDocumentListFilters } from '@/lib/documentListFilters/useDocumentListFilters';
import { useExportCsv } from '@/hooks/useExportCsv';
import { useAuth } from '@/hooks/useAuth';
import type { LayoutVariant } from '@/lib/documentListFilters/defaults';
import { TopNav } from '@/pages/HomePageV2/components/TopNav';
import { KpiStrip } from './components/KpiStrip';
import { FilterStrip } from './components/FilterStrip';
import { ContractsTable } from './components/ContractsTable';
import { ContractCards } from './components/ContractCards';
import { ContractMinimal } from './components/ContractMinimal';
import { LayoutToggle } from './components/LayoutToggle';
import { SideColumn } from './components/SideColumn';
import { Pagination } from './components/Pagination';
import styles from './PortfolioPage.module.css';

export function PortfolioPage() {
  const navigate = useNavigate();
  const { filters, setFilters, setQueryText } = useDocumentListFilters();
  const { items, total, page, pageSize, totalPages, summary, isLoading, isFetching, error, refetch } =
    useDocumentList(filters);
  const { exportCsv, isExporting } = useExportCsv(filters, total);
  const { user } = useAuth();

  const layout = filters.layout;

  function handleLayoutChange(v: LayoutVariant) {
    setFilters({ layout: v });
  }

  const userInitials = useMemo(() => {
    const src = user?.name?.trim() || user?.email || 'U';
    const parts = src.split(/\s+/).slice(0, 2);
    return (parts.map((p) => p[0] ?? '').join('').toUpperCase() || 'U').slice(0, 2);
  }, [user]);

  function handleNav(id: string) {
    switch (id) {
      case 'home':      navigate('/v2'); break;
      case 'portfolio': navigate('/contracts'); break;
      case 'ask':       navigate('/ask'); break;
      case 'upload':    navigate('/upload'); break;
      case 'renewals':  navigate('/renewals'); break;
      case 'settings':  navigate('/settings'); break;
      default:
        // playbook / compare don't have routes yet
        // eslint-disable-next-line no-console
        console.info('[PortfolioPage] nav →', id, '(no route yet)');
    }
  }

  const contentProps = { items, total, isLoading, isFetching, error, onRetry: refetch };

  return (
    <div className={styles.shell}>
      <TopNav active="portfolio" userInitials={userInitials} onNav={handleNav} />
      <div className={styles.page}>
        {/* Page header — white bar matching wireframe PageShell */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Contracts</h1>
            <p className={styles.subtitle}>
              {isLoading ? 'Loading…' : `${summary.analysed} contract${summary.analysed === 1 ? '' : 's'} analysed`}
            </p>
          </div>
          <div className={styles.actions}>
            <LayoutToggle value={layout} onChange={handleLayoutChange} />
            <button
              className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
              onClick={exportCsv}
              disabled={isExporting || total === 0}
            >
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={() => navigate('/upload')}
            >
              + Upload
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.body}>
          {/* KPI strip (hidden in minimal layout) */}
          {layout !== 'minimal' && (
            <KpiStrip summary={summary} isLoading={isLoading} />
          )}

          {/* Filter strip */}
          <FilterStrip
            filters={filters}
            onQueryChange={setQueryText}
            onFilterChange={setFilters}
          />

          {/* Main: table/cards + side column */}
          {layout === 'table' ? (
            <div className={styles.mainGrid}>
              <div>
                <ContractsTable {...contentProps} />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  pageSize={pageSize}
                  onPageChange={(p) => setFilters({ page: p })}
                />
              </div>
              <SideColumn summary={summary} isLoading={isLoading} />
            </div>
          ) : (
            <>
              {layout === 'cards'   && <ContractCards  {...contentProps} />}
              {layout === 'minimal' && <ContractMinimal {...contentProps} />}
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={(p) => setFilters({ page: p })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
