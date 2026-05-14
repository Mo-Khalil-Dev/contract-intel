import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../HomePageV2/components/Button';
import styles from './ProcessingPage.module.css';

/**
 * Stub processing page (Phase 5).
 *
 * In v1 the upload completes synchronously (no extraction pipeline yet),
 * so this page just confirms the file landed and offers a way back.
 * When OCR/extraction ships in a later phase, this becomes a polled
 * status screen with progress.
 */
export function ProcessingPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <div className={styles.iconWrap}>
          <CheckCircle2 size={28} strokeWidth={2} aria-hidden="true" />
        </div>
        <h1 className={styles.title}>Upload complete</h1>
        <p className={styles.subtitle}>
          Your contract has been uploaded. Analysis will appear in the dashboard once it's ready.
        </p>
        <div className={styles.idRow}>
          <span className={styles.idLabel}>Document ID</span>
          <code className={styles.idValue}>{documentId}</code>
        </div>
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
