import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge } from '@/components/core/RiskBadge';
import { TypePill } from '@/components/core/TypePill';
import { RecentContractItem } from '@/types/referenceData';
import styles from './WhereToStartSection.module.css';

interface WhereToStartSectionProps {
  lastOpenedContract?: RecentContractItem | null;
  onUpload: () => void;
}

export function WhereToStartSection({ lastOpenedContract, onUpload }: WhereToStartSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        <Card className={styles.uploadCard}>
          <CardContent className={styles.uploadCardContent}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'white', marginBottom: 'var(--spacing-xs)' }}>WHERE TO START</div>
            <h3 style={{ color: 'white', fontSize: '1.125rem', margin: '0 0 var(--spacing-md) 0', fontWeight: 600 }}>Send a contract for review</h3>
            <p className={styles.uploadDescription}>Drop a PDF or Word file here and ContractIntel will run it against the Northwind playbook before passing it to a reviewer.</p>
            <Button onClick={onUpload} className={styles.uploadButton}>
              + Upload contract
            </Button>
            <p className={styles.uploadMeta}>PDF, DOCX - up to 50 MB · 60s analysis</p>
          </CardContent>
        </Card>

        <div className={styles.rightColumn}>
          <div className={styles.rightColumnTitle}>Pick up where you left off</div>
          {lastOpenedContract && (
            <Card>
              <CardHeader>
                <CardTitle className={styles.cardTitle}>Resume</CardTitle>
              </CardHeader>
              <CardContent className={styles.resumeContent}>
                <div className={styles.contractName}>{lastOpenedContract.name}</div>
                <div className={styles.contractMeta}>
                  <TypePill type={lastOpenedContract.type} />
                  <RiskBadge score={lastOpenedContract.riskScore} size="sm" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className={styles.cardTitle}>Sample contract</CardTitle>
            </CardHeader>
            <CardContent className={styles.sampleContent}>
              <p>Review a sample contract to see what intelligence we extract.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
