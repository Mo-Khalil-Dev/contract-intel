import type { RankedListData } from '@/types/ask';
import styles from './RiskResultTable.module.css';

interface RiskResultTableProps {
  data: RankedListData;
  onOpenDocument: (documentId: string) => void;
}

const BAND_CLASS: Record<string, string> = {
  high: styles.bandHigh,
  medium: styles.bandMedium,
  low: styles.bandLow,
  unknown: styles.bandUnknown,
};

/**
 * Risk-analysis result block (Task 12.8). Renders the ranked contracts
 * returned by the risk handler: title, type, counterparty, risk score +
 * band, red flags, and an unlimited-liability marker. Rows link to the
 * contract. Empty state when nothing is in scope.
 */
export function RiskResultTable({ data, onOpenDocument }: RiskResultTableProps) {
  if (data.rows.length === 0) {
    return (
      <p className={styles.empty}>
        No analysed contracts are in scope yet. Upload and process contracts to
        get risk answers.
      </p>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Contract</th>
            <th>Type</th>
            <th className={styles.num}>Risk</th>
            <th className={styles.num}>Red flags</th>
            <th>Liability</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr
              key={row.documentId}
              className={styles.row}
              onClick={() => onOpenDocument(row.documentId)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onOpenDocument(row.documentId);
              }}
            >
              <td>
                <div className={styles.title}>{row.title}</div>
                <div className={styles.counterparty}>
                  {row.counterparty || 'Unknown counterparty'}
                </div>
              </td>
              <td className={styles.type}>{row.type}</td>
              <td className={styles.num}>
                <span className={`${styles.band} ${BAND_CLASS[row.riskBand]}`}>
                  {row.riskScore ?? '—'}
                </span>
              </td>
              <td className={styles.num}>{row.flagsRed}</td>
              <td>
                {row.hasUnlimitedLiability ? (
                  <span className={styles.uncapped}>Unlimited</span>
                ) : (
                  <span className={styles.capped}>Capped</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
