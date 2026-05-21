import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../HomePageV2/components/Button';
import { TopNav } from '../HomePageV2/components/TopNav';
import styles from './ResultsPage.module.css';
import { Tabs } from './components/Tabs';
import { RightSidebar } from './components/RightSidebar';
import { OverviewTab } from './tabs/OverviewTab';
import { RiskFlagsTab } from './tabs/RiskFlagsTab';
import { ClausesTab } from './tabs/ClausesTab';
import { DocumentTab } from './tabs/DocumentTab';
import type {
  ClauseResponse,
  ContractMetadata,
  ExtractionStatusResponse,
} from '@/types/clauses';
import { documentRiskScore, flagCounts } from '@/lib/riskHelpers';

export type ResultsTabId =
  | 'overview'
  | 'risks'
  | 'clauses'
  | 'document'
  | 'history';

export interface ResultsPageViewProps {
  documentId: string | undefined;
  /** Filename for the breadcrumb. Falls back to documentId when missing. */
  filename?: string;
  clauses: ClauseResponse[];
  extraction: ExtractionStatusResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  onBackToContracts: () => void;
  onExport: () => void;
  onApprove: () => void;
  onShare: () => void;
}

/**
 * Presentational shell — breadcrumb + tabs + main + right sidebar.
 * Owns the active-tab state but no data fetching. Container wires
 * useExtractionStatus + useClauses.
 */
export function ResultsPageView({
  documentId,
  filename,
  clauses,
  extraction,
  isLoading,
  isError,
  onBackToContracts,
  onExport,
  onApprove,
  onShare,
}: ResultsPageViewProps) {
  const [activeTab, setActiveTab] = useState<ResultsTabId>('overview');
  const navigate = useNavigate();
  const { user } = useAuth();

  const metadata: ContractMetadata | null = extraction?.metadata ?? null;
  const riskScore = useMemo(() => documentRiskScore(clauses), [clauses]);
  const counts = useMemo(() => flagCounts(clauses), [clauses]);
  // The Risk Flags tab badge shows only critical + caution counts —
  // informational (low) clauses surface on Overview but aren't flags.
  const riskFlagCount = counts.critical + counts.caution;

  // TopNav wiring — matches PortfolioPage so cross-page nav stays
  // consistent. "portfolio" is the active item because Results is
  // reached from the Contracts list.
  const userInitials = useMemo(() => {
    const src = user?.name?.trim() || user?.email || 'U';
    const parts = src.split(/\s+/).slice(0, 2);
    return (parts.map((p) => p[0] ?? '').join('').toUpperCase() || 'U').slice(0, 2);
  }, [user]);
  const handleNav = (id: string) => {
    switch (id) {
      case 'home':      navigate('/v2'); break;
      case 'portfolio': navigate('/contracts'); break;
      case 'upload':    navigate('/upload'); break;
      default:
        // playbook / compare / renewals / settings have no routes yet
        // eslint-disable-next-line no-console
        console.info('[ResultsPage] nav →', id, '(no route yet)');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.root}>
        <TopNav active="portfolio" userInitials={userInitials} onNav={handleNav} />
        <Breadcrumb
          filename={filename ?? documentId ?? ''}
          onBack={onBackToContracts}
          onExport={onExport}
          onApprove={onApprove}
        />
        <div className={styles.centerFallback}>Loading analysis…</div>
      </div>
    );
  }

  if (isError || !extraction) {
    return (
      <div className={styles.root}>
        <TopNav active="portfolio" userInitials={userInitials} onNav={handleNav} />
        <Breadcrumb
          filename={filename ?? documentId ?? ''}
          onBack={onBackToContracts}
          onExport={onExport}
          onApprove={onApprove}
        />
        <div className={styles.centerFallback}>
          We couldn't load this document's analysis. Try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <TopNav active="portfolio" userInitials={userInitials} onNav={handleNav} />
      <Breadcrumb
        filename={filename ?? documentId ?? ''}
        onBack={onBackToContracts}
        onExport={onExport}
        onApprove={onApprove}
      />
      <div className={styles.body}>
        <main className={styles.main}>
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'risks', label: 'Risk Flags', count: riskFlagCount },
              { id: 'clauses', label: 'Clauses', count: clauses.length },
              { id: 'document', label: 'Document' },
              { id: 'history', label: 'History' },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
          <div className={styles.tabContent}>
            {activeTab === 'overview' && (
              <OverviewTab
                metadata={metadata}
                clauses={clauses}
                documentRiskScore={riskScore}
              />
            )}
            {activeTab === 'risks' && <RiskFlagsTab clauses={clauses} />}
            {activeTab === 'clauses' && <ClausesTab clauses={clauses} />}
            {activeTab === 'document' && (
              <DocumentTab
                documentId={documentId}
                filename={filename}
                clauses={clauses}
                enabled={activeTab === 'document'}
              />
            )}
            {activeTab === 'history' && (
              <ComingSoon
                title="History"
                body="The audit trail of extractions, reviews, and annotations ships in Phase 11 (Collaboration)."
              />
            )}
          </div>
        </main>
        <div className={styles.sidebar}>
          <RightSidebar
            riskScore={riskScore}
            metadata={metadata}
            onExport={onExport}
            onShare={onShare}
          />
        </div>
      </div>
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────

function Breadcrumb({
  filename,
  onBack,
  onExport,
  onApprove,
}: {
  filename: string;
  onBack: () => void;
  onExport: () => void;
  onApprove: () => void;
}) {
  return (
    <div className={styles.breadcrumbBar}>
      <button type="button" className={styles.crumbLink} onClick={onBack}>
        Contracts
      </button>
      <span className={styles.crumbSep} aria-hidden="true">
        /
      </span>
      <span className={styles.crumbCurrent} title={filename}>
        {filename}
      </span>
      <div className={styles.crumbActions}>
        <Button size="sm" variant="secondary" onClick={onExport}>
          Export
        </Button>
        <Button size="sm" onClick={onApprove}>
          Approve
        </Button>
      </div>
    </div>
  );
}

// ── Coming-soon placeholder for tabs ──────────────────────────────

function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ maxWidth: 560 }}>
      <h2
        style={{
          margin: '0 0 8px',
          fontSize: 'var(--text-2xl)',
          fontWeight: 700,
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-sm)',
          color: 'var(--color-ink-soft)',
          lineHeight: 1.6,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {body}
      </p>
    </div>
  );
}
