import { useNavigate } from 'react-router-dom';
import type { AnswerCardState } from '@/hooks/useAskPortfolio';
import type { RankedListData } from '@/types/ask';
import { RiskResultTable } from './RiskResultTable';
import styles from './AnswerCard.module.css';

interface AnswerCardProps {
  card: AnswerCardState;
  onDismiss: (localId: string) => void;
}

/**
 * The frame around every answer (Task 12.8): a header echoing the
 * question with a dismiss action, a body (prose + a format-specific
 * result block), and a footer listing validated sources. Pending and
 * error states render in the same frame. `aria-live="polite"` announces
 * the answer once it lands.
 */
export function AnswerCard({ card, onDismiss }: AnswerCardProps) {
  const navigate = useNavigate();
  const { answer, status } = card;

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.askedWrap}>
          <span className={styles.askedLabel}>✦ You asked</span>
          <p className={styles.question}>{card.question}</p>
        </div>
        <button
          type="button"
          className={styles.dismiss}
          aria-label="Dismiss answer"
          onClick={() => onDismiss(card.localId)}
        >
          ✕
        </button>
      </header>

      <div className={styles.body} aria-live="polite">
        {status === 'pending' && (
          <p className={styles.pending}>Reading your portfolio…</p>
        )}

        {status === 'error' && (
          <p className={styles.error}>
            {card.error?.detail ??
              'Something went wrong generating this answer. Please try again.'}
          </p>
        )}

        {status === 'success' && answer && (
          <>
            <p className={styles.prose}>{answer.prose}</p>

            {answer.format === 'ranked-list' && answer.structuredData && (
              <RiskResultTable
                data={answer.structuredData as RankedListData}
                onOpenDocument={(id) => navigate(`/results/${id}`)}
              />
            )}
          </>
        )}
      </div>

      {status === 'success' && answer && answer.citations.length > 0 && (
        <footer className={styles.footer}>
          <span className={styles.sourcesLabel}>Sources</span>
          <ul className={styles.sources}>
            {answer.citations.map((c) => (
              <li key={c.index}>
                <button
                  type="button"
                  className={styles.source}
                  onClick={() => navigate(`/results/${c.documentId}`)}
                >
                  <span className={styles.sourceIndex}>[{c.index}]</span>
                  {c.title}
                </button>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}
