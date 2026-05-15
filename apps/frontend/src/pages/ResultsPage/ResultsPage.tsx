import { useParams, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Button } from '../HomePageV2/components/Button';
import styles from './ResultsPage.module.css';

/**
 * Phase-7 stub. ProcessingPage redirects here on `ocr_complete`. The full
 * results UI (clauses, risk, flags) ships in a later phase — for now we
 * just confirm OCR succeeded and offer paths forward so the redirect
 * doesn't dead-end.
 */
export function ResultsPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <div className={styles.iconWrap}>
          <FileText size={28} strokeWidth={2} aria-hidden="true" />
        </div>
        <h1 className={styles.title}>Analysis ready</h1>
        <p className={styles.subtitle}>
          We've extracted the text from your contract. The full clause-and-risk
          breakdown is coming in the next release.
        </p>
        {documentId && (
          <div className={styles.idRow}>
            <span className={styles.idLabel}>Document ID</span>
            <code className={styles.idValue}>{documentId}</code>
          </div>
        )}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate('/upload')}>
            Upload another
          </Button>
          <Button onClick={() => navigate('/')}>Back to dashboard</Button>
        </div>
      </main>
    </div>
  );
}
