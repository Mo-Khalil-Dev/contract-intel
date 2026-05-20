import { useNavigate } from 'react-router-dom';
import type { DocumentListItem } from '@/types/contracts';
import { RiskBadge } from '@/components/core/RiskBadge';
import { FlagsSummary } from '@/components/core/FlagsSummary';
import styles from './ContractsTable.module.css';

// ── Helpers ──────────────────────────────────────────────────────

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
  const cls =
    status === 'complete' ? styles.statusComplete
    : status === 'failed' ? styles.statusFailed
    : styles.statusProcessing;
  const label = status === 'complete' ? 'Complete' : status === 'failed' ? 'Failed' : 'Analysing';
  return <span className={`${styles.statusBadge} ${cls}`}>{label}</span>;
}

function SkeletonRow() {
  return (
    <tr className={styles.row}>
      {[220, 70, 120, 60, 80, 90, 70].map((w, i) => (
        <td key={i} className={styles.td}>
          <span className={styles.skeleton} style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── ContractRow ───────────────────────────────────────────────────

function ContractRow({ item }: { item: DocumentListItem }) {
  const navigate = useNavigate();
  const isComplete = item.status === 'complete';
  const isFailed = item.status === 'failed';

  const rowClass = [
    styles.row,
    isComplete ? styles.rowClickable : '',
    isFailed ? styles.rowFailed : '',
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
    <tr
      className={rowClass}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isComplete ? 0 : undefined}
      role={isComplete ? 'button' : undefined}
      aria-label={isComplete ? `Open ${item.name}` : undefined}
    >
      <td className={`${styles.td} ${styles.nameCell}`} title={item.name}>{item.name}</td>
      <td className={styles.td}><TypeChip type={item.type} /></td>
      <td className={`${styles.td} ${!item.counterparty ? styles.muted : ''}`}>
        {item.counterparty || '—'}
      </td>
      <td className={styles.td}>
        {item.riskScore !== null
          ? <RiskBadge score={item.riskScore} size="sm" />
          : <span className={styles.muted}>—</span>
        }
      </td>
      <td className={styles.td}>
        <FlagsSummary red={item.flagsRed} orange={item.flagsOrange} green={item.flagsBlue} />
      </td>
      <td className={`${styles.td} ${styles.muted}`}>{formatDate(item.terminationDate)}</td>
      <td className={styles.td}><StatusBadge status={item.status} /></td>
    </tr>
  );
}

// ── ContractsTable ────────────────────────────────────────────────

interface ContractsTableProps {
  items: DocumentListItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
}

export function ContractsTable({ items, total, isLoading, isFetching, error, onRetry }: ContractsTableProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.cardTitle}>
          {isLoading ? 'Contracts' : `${total} contract${total === 1 ? '' : 's'} found`}
        </p>
        {isFetching && !isLoading && <span className={styles.fetching}>Updating…</span>}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table} aria-label="Contracts">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Counterparty</th>
              <th scope="col">Risk</th>
              <th scope="col">Flags</th>
              <th scope="col">Termination</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && [0,1,2,3].map((i) => <SkeletonRow key={i} />)}

            {!isLoading && !!error && (
              <tr className={styles.stateRow}>
                <td colSpan={7}>
                  <p className={styles.stateMsg}>Failed to load contracts.</p>
                  <button className={styles.stateLink} onClick={onRetry}>Try again</button>
                </td>
              </tr>
            )}

            {!isLoading && !error && items.length === 0 && (
              <tr className={styles.stateRow}>
                <td colSpan={7}>
                  <p className={styles.stateMsg}>No contracts match your filters.</p>
                  <a className={styles.stateLink} href="/upload">Upload your first contract →</a>
                </td>
              </tr>
            )}

            {!isLoading && !error && items.map((item) => (
              <ContractRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
