import { track } from '@/analytics';
import type { RecentContractItem } from '../types';
import { FlagsSummary } from './FlagsSummary';
import { RiskBadge } from './RiskBadge';
import { TypePill } from './TypePill';
import styles from './RecentContractsCard.module.css';

interface RecentContractsCardProps {
  contracts: RecentContractItem[];
  onSeeAll: () => void;
  onRowClick: (contract: RecentContractItem) => void;
}

function formatUploadDate(raw: string | Date): string {
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  // Short, dense format (matches wireframe density: "uploaded 14 Apr").
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function getRiskBucket(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/** Card with a header strip and a stacked list of recent contract rows. */
export function RecentContractsCard({ contracts, onSeeAll, onRowClick }: RecentContractsCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Your recent contracts</div>
          <div className={styles.subtitle}>Most recently uploaded or reviewed</div>
        </div>
        <button type="button" className={styles.seeAll} onClick={onSeeAll}>
          See all →
        </button>
      </div>
      {contracts.map((c, position) => (
        <div
          key={c.id}
          className={styles.row}
          onClick={() => {
            track('recent_contract_clicked', {
              position,
              risk_bucket: getRiskBucket(c.riskScore),
            });
            onRowClick(c);
          }}
        >
          <TypePill type={c.type} />
          <div className={styles.rowMain}>
            <div className={styles.rowTitle}>{c.name.replace(/\.[^.]+$/, '')}</div>
            <div className={styles.rowMeta}>
              {c.party} · uploaded {formatUploadDate(c.uploadedAt)}
            </div>
          </div>
          <FlagsSummary count={c.flagCount} riskScore={c.riskScore} />
          <RiskBadge score={c.riskScore} />
        </div>
      ))}
    </div>
  );
}
