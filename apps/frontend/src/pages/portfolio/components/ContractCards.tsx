import { useNavigate } from 'react-router-dom';
import type { DocumentListItem } from '@/types/contracts';
import { RiskBadge } from '@/components/core/RiskBadge';
import { FlagsSummary } from '@/components/core/FlagsSummary';
import styles from './ContractCards.module.css';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  vendor:      { color: '#475569', bg: '#F1F5F9' },
  license:     { color: '#0369A1', bg: '#F0F9FF' },
  partnership: { color: '#0F766E', bg: '#F0FDFA' },
  customer:    { color: '#B45309', bg: '#FFFBEB' },
  lease:       { color: '#9F1239', bg: '#FFF1F2' },
  nda:         { color: '#374151', bg: '#F9FAFB' },
  other:       { color: '#6B7280', bg: '#F3F4F6' },
};

function TypeChip({ type }: { type: string }) {
  const p = TYPE_COLORS[type] ?? TYPE_COLORS.other;
  return (
    <span style={{ color: p.color, background: p.bg, padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: DocumentListItem['status'] }) {
  const colors: Record<DocumentListItem['status'], { color: string; bg: string; label: string }> = {
    complete:   { color: '#15803D', bg: '#F0FDF4', label: 'Complete' },
    failed:     { color: '#B91C1C', bg: '#FEF2F2', label: 'Failed' },
    processing: { color: '#B45309', bg: '#FFFBEB', label: 'Analysing' },
  };
  const c = colors[status];
  return (
    <span style={{ color: c.color, background: c.bg, padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {c.label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.card}>
      <span className={styles.skeleton} style={{ width: '70%', height: 16, marginBottom: 4 }} />
      <span className={styles.skeleton} style={{ width: '40%' }} />
      <div className={styles.divider} />
      <span className={styles.skeleton} style={{ width: '55%' }} />
    </div>
  );
}

function ContractCard({ item }: { item: DocumentListItem }) {
  const navigate = useNavigate();
  const isComplete = item.status === 'complete';
  const isFailed = item.status === 'failed';

  const cls = [
    styles.card,
    isComplete ? styles.cardClickable : '',
    isFailed ? styles.cardFailed : '',
  ].join(' ');

  function handleClick() {
    if (isComplete) navigate(`/results/${item.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (isComplete && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      navigate(`/results/${item.id}`);
    }
  }

  return (
    <div
      className={cls}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isComplete ? 0 : undefined}
      role={isComplete ? 'button' : undefined}
      aria-label={isComplete ? `Open ${item.name}` : undefined}
    >
      <p className={styles.name} title={item.name}>{item.name}</p>

      <div className={styles.meta}>
        <TypeChip type={item.type} />
        <StatusBadge status={item.status} />
      </div>

      <div className={styles.divider} />

      <div className={styles.row}>
        <span className={styles.label}>Risk</span>
        {item.riskScore !== null
          ? <RiskBadge score={item.riskScore} size="sm" />
          : <span className={styles.value}>—</span>
        }
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Flags</span>
        <FlagsSummary red={item.flagsRed} orange={item.flagsOrange} green={item.flagsBlue} />
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Terminates</span>
        <span className={styles.value}>{formatDate(item.terminationDate)}</span>
      </div>
    </div>
  );
}

interface ContractCardsProps {
  items: DocumentListItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
}

export function ContractCards({ items, total, isLoading, isFetching, error, onRetry }: ContractCardsProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>
          {isLoading ? 'Contracts' : `${total} contract${total === 1 ? '' : 's'} found`}
        </p>
        {isFetching && !isLoading && (
          <span style={{ fontSize: 12, color: 'var(--color-ink-mute)' }}>Updating…</span>
        )}
      </div>

      <div className={styles.grid}>
        {isLoading && [0,1,2,3,4,5].map((i) => <SkeletonCard key={i} />)}

        {!isLoading && !!error && (
          <div className={styles.stateCard}>
            <p className={styles.stateMsg}>Failed to load contracts.</p>
            <button className={styles.stateLink} onClick={onRetry}>Try again</button>
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className={styles.stateCard}>
            <p className={styles.stateMsg}>No contracts match your filters.</p>
            <a className={styles.stateLink} href="/upload">Upload your first contract →</a>
          </div>
        )}

        {!isLoading && !error && items.map((item) => (
          <ContractCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
