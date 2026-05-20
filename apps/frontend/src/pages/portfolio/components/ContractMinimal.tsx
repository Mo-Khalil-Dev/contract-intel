import { useNavigate } from 'react-router-dom';
import type { DocumentListItem } from '@/types/contracts';
import { RiskBadge } from '@/components/core/RiskBadge';
import styles from './ContractMinimal.module.css';

const STATUS_STYLE: Record<DocumentListItem['status'], { color: string; bg: string; label: string }> = {
  complete:   { color: '#15803D', bg: '#F0FDF4', label: 'Complete' },
  failed:     { color: '#B91C1C', bg: '#FEF2F2', label: 'Failed' },
  processing: { color: '#B45309', bg: '#FFFBEB', label: 'Analysing' },
};

function SkeletonItem() {
  return (
    <li className={styles.item}>
      <span className={styles.skeleton} style={{ width: '55%' }} />
      <span className={styles.skeleton} style={{ width: 40 }} />
      <span className={styles.skeleton} style={{ width: 60, borderRadius: 999 }} />
    </li>
  );
}

function MinimalItem({ item }: { item: DocumentListItem }) {
  const navigate = useNavigate();
  const isComplete = item.status === 'complete';
  const isFailed = item.status === 'failed';
  const st = STATUS_STYLE[item.status];

  const cls = [
    styles.item,
    isComplete ? styles.itemClickable : '',
    isFailed ? styles.itemFailed : '',
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
    <li
      className={cls}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isComplete ? 0 : undefined}
      role={isComplete ? 'button' : undefined}
      aria-label={isComplete ? `Open ${item.name}` : undefined}
    >
      <span className={styles.name} title={item.name}>{item.name}</span>
      <span className={styles.risk}>
        {item.riskScore !== null
          ? <RiskBadge score={item.riskScore} size="sm" />
          : <span style={{ color: 'var(--color-ink-mute)', fontSize: 13 }}>—</span>
        }
      </span>
      <span className={styles.status} style={{ color: st.color, background: st.bg }}>
        {st.label}
      </span>
    </li>
  );
}

interface ContractMinimalProps {
  items: DocumentListItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
}

export function ContractMinimal({ items, total, isLoading, isFetching, error, onRetry }: ContractMinimalProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <p className={styles.headerTitle}>
          {isLoading ? 'Contracts' : `${total} contract${total === 1 ? '' : 's'} found`}
        </p>
        {isFetching && !isLoading && <span className={styles.fetching}>Updating…</span>}
      </div>

      <ul className={styles.list} aria-label="Contracts">
        {isLoading && [0,1,2,3,4,5,6,7].map((i) => <SkeletonItem key={i} />)}

        {!isLoading && !!error && (
          <li className={styles.stateRow}>
            <p className={styles.stateMsg}>Failed to load contracts.</p>
            <button className={styles.stateLink} onClick={onRetry}>Try again</button>
          </li>
        )}

        {!isLoading && !error && items.length === 0 && (
          <li className={styles.stateRow}>
            <p className={styles.stateMsg}>No contracts match your filters.</p>
            <a className={styles.stateLink} href="/upload">Upload your first contract →</a>
          </li>
        )}

        {!isLoading && !error && items.map((item) => (
          <MinimalItem key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}
