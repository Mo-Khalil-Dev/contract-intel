import { ReactNode } from 'react';
import styles from './SideCard.module.css';

interface ResumeCardProps {
  eyebrow: string;
  title: string;
  meta: ReactNode;
  onClick: () => void;
}

/** Pick-up-where-you-left-off variant (eyebrow + title + meta row). */
export function ResumeCard({ eyebrow, title, meta, onClick }: ResumeCardProps) {
  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <div className={styles.title}>{title}</div>
      <div className={styles.meta}>{meta}</div>
    </div>
  );
}

interface LinkCardProps {
  title: string;
  sub: string;
  onClick: () => void;
}

/** Compact link tile with title + sub on left, → arrow on right. */
export function LinkCard({ title, sub, onClick }: LinkCardProps) {
  return (
    <div className={styles.linkCard} onClick={onClick} role="button" tabIndex={0}>
      <div>
        <div className={styles.linkTitle}>{title}</div>
        <div className={styles.linkSub}>{sub}</div>
      </div>
      <span className={styles.arrow}>→</span>
    </div>
  );
}
