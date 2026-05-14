import { RiskBadge } from '@/components/core/RiskBadge';
import { TypePill } from '@/components/core/TypePill';
import { RecentContractItem } from '@/types/referenceData';
import styles from './RecentContractsSection.module.css';

interface RecentContractsSectionProps {
  contracts: RecentContractItem[];
  onSelectContract: (contractId: string) => void;
}

export function RecentContractsSection({
  contracts,
  onSelectContract,
}: RecentContractsSectionProps) {
  const displayedContracts = contracts.slice(0, 4);

  if (displayedContracts.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Recent contracts</h2>
        <div className={styles.emptyState}>No contracts uploaded yet</div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Recent contracts</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Risk</th>
              <th scope="col">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {displayedContracts.map((contract, idx) => (
              <tr
                key={contract.id}
                className={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}
                onClick={() => onSelectContract(contract.id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectContract(contract.id);
                  }
                }}
              >
                <td className={styles.nameCell}>
                  <span title={contract.name}>{contract.name}</span>
                </td>
                <td>
                  <TypePill type={contract.type} />
                </td>
                <td>
                  <RiskBadge score={contract.riskScore} size="sm" />
                </td>
                <td className={styles.dateCell}>
                  {new Date(contract.uploadedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
