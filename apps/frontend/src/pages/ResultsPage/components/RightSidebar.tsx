import { Button } from '../../HomePageV2/components/Button';
import styles from './RightSidebar.module.css';
import type { ContractMetadata } from '@/types/clauses';
import {
  deriveCounterparty,
  riskBgVar,
  riskColorVar,
  riskShort,
} from '@/lib/riskHelpers';

interface RightSidebarProps {
  riskScore: number | null;
  metadata: ContractMetadata | null;
  onExport: () => void;
  onShare: () => void;
}

/**
 * 272px right rail. Mini risk score on top, contract details list,
 * Export PDF / Share buttons at the bottom. Mirrors the wireframe.
 * Each row falls back to "—" when metadata is missing.
 */
export function RightSidebar({
  riskScore,
  metadata,
  onExport,
  onShare,
}: RightSidebarProps) {
  const counterparty = metadata ? deriveCounterparty(metadata.parties) : null;

  return (
    <aside className={styles.sidebar} aria-label="Contract summary">
      <RiskMiniCard score={riskScore} />

      <div>
        <h3 className={styles.sectionLabel}>Contract details</h3>
        <ul className={styles.detailsList}>
          <DetailRow label="Type" value={metadata?.contractType ?? null} />
          <DetailRow label="Counterparty" value={counterparty} />
          <DetailRow label="Effective" value={metadata?.effectiveDate ?? null} />
          <DetailRow label="Expires" value={metadata?.terminationDate ?? null} />
          <DetailRow label="Notice" value={metadata?.noticePeriod ?? null} />
          <DetailRow
            label="Auto-Renewal"
            value={metadata?.autoRenewal ?? null}
          />
          <DetailRow label="Value" value={metadata?.paymentAmount ?? null} />
        </ul>
      </div>

      <div className={styles.actions}>
        <Button size="sm" full onClick={onExport}>
          Export PDF
        </Button>
        <Button size="sm" variant="secondary" full onClick={onShare}>
          Share with team
        </Button>
      </div>
    </aside>
  );
}

function RiskMiniCard({ score }: { score: number | null }) {
  // When extraction hasn't completed (or returned 0 clauses), we show
  // a muted placeholder rather than misleading 0.0.
  if (score === null) {
    return (
      <div
        className={styles.riskCard}
        style={{
          background: 'var(--color-bg-alt)',
          borderColor: 'var(--color-border)',
        }}
      >
        <p className={styles.riskLabel}>Risk Score</p>
        <div
          className={styles.riskScore}
          style={{ color: 'var(--color-ink-mute)' }}
        >
          —
        </div>
        <div
          className={styles.riskBand}
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Pending
        </div>
      </div>
    );
  }

  const color = riskColorVar(score);
  const bg = riskBgVar(score);
  return (
    <div
      className={styles.riskCard}
      style={{ background: bg, borderColor: `color-mix(in srgb, ${color} 33%, transparent)` }}
    >
      <p className={styles.riskLabel}>Risk Score</p>
      <div className={styles.riskScore} style={{ color }}>
        {score.toFixed(1)}
      </div>
      <div className={styles.riskBand} style={{ color }}>
        {riskShort(score)} Risk
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  const display = value ?? '—';
  const mute = !value;
  return (
    <li className={styles.detailsRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span
        className={`${styles.detailValue} ${mute ? styles.detailValueMute : ''}`}
      >
        {display}
      </span>
    </li>
  );
}
