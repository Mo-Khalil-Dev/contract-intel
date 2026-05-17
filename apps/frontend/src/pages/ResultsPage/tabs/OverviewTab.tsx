import { useState } from 'react';
import { Button } from '../../HomePageV2/components/Button';
import styles from './OverviewTab.module.css';
import type { ClauseResponse, ContractMetadata } from '@/types/clauses';
import {
  flagCounts,
  riskBgVar,
  riskColorVar,
  riskLabel,
} from '@/lib/riskHelpers';

interface OverviewTabProps {
  metadata: ContractMetadata | null;
  clauses: ClauseResponse[];
  documentRiskScore: number | null;
}

/**
 * Overview tab content — risk snapshot card + Parties / Key Dates /
 * Financial Terms + Notes thread. Notes are local-only React state
 * (Phase 11 wires real persistence).
 */
export function OverviewTab({
  metadata,
  clauses,
  documentRiskScore,
}: OverviewTabProps) {
  return (
    <div className={styles.column}>
      <RiskAssessmentCard score={documentRiskScore} clauses={clauses} />

      <Section title="Parties">
        {metadata && metadata.parties.length > 0 ? (
          metadata.parties.map((p, i) => (
            <DetailRow key={`${p.role}-${i}`} label={p.role} value={p.name} />
          ))
        ) : (
          <EmptySection label="No parties extracted" />
        )}
      </Section>

      <Section title="Key Dates">
        <DetailRow label="Effective" value={metadata?.effectiveDate ?? null} />
        <DetailRow label="Expires" value={metadata?.terminationDate ?? null} />
        <DetailRow label="Notice Period" value={metadata?.noticePeriod ?? null} />
        <DetailRow label="Auto-Renewal" value={metadata?.autoRenewal ?? null} />
      </Section>

      <Section title="Financial Terms">
        <DetailRow label="Value" value={metadata?.paymentAmount ?? null} />
        <DetailRow label="Currency" value={metadata?.currency ?? null} />
        <DetailRow label="Schedule" value={metadata?.paymentSchedule ?? null} />
        <DetailRow label="Escalation" value={metadata?.priceEscalation ?? null} />
        <DetailRow label="Payment Terms" value={metadata?.paymentTerms ?? null} />
      </Section>

      <NotesSection />
    </div>
  );
}

// ── Risk Assessment card ───────────────────────────────────────────

function RiskAssessmentCard({
  score,
  clauses,
}: {
  score: number | null;
  clauses: ClauseResponse[];
}) {
  const counts = flagCounts(clauses);

  if (score === null) {
    return (
      <div className={`${styles.riskCard} ${styles.riskCardEmpty}`}>
        <div>
          <p className={styles.riskHeading}>Risk Assessment</p>
          <div className={styles.riskScoreRow}>
            <span
              className={styles.riskScore}
              style={{ color: 'var(--color-ink-mute)' }}
            >
              —
            </span>
            <span
              className={styles.riskBand}
              style={{ color: 'var(--color-ink-soft)' }}
            >
              Pending
            </span>
          </div>
        </div>
      </div>
    );
  }

  const color = riskColorVar(score);
  const bg = riskBgVar(score);

  return (
    <div
      className={styles.riskCard}
      style={{
        background: bg,
        borderColor: `color-mix(in srgb, ${color} 33%, transparent)`,
      }}
    >
      <div>
        <p className={styles.riskHeading}>Risk Assessment</p>
        <div className={styles.riskScoreRow}>
          <span className={styles.riskScore} style={{ color }}>
            {score.toFixed(1)}
          </span>
          <span className={styles.riskBand} style={{ color }}>
            {riskLabel(score)}
          </span>
        </div>
      </div>
      <div className={styles.flagCounts}>
        <FlagCount n={counts.critical} label="Critical" color="var(--color-red)" />
        <FlagCount n={counts.caution} label="Caution" color="var(--color-orange)" />
        <FlagCount n={counts.info} label="Info" color="var(--color-green)" />
      </div>
    </div>
  );
}

function FlagCount({
  n,
  label,
  color,
}: {
  n: number;
  label: string;
  color: string;
}) {
  return (
    <div className={styles.flagCount}>
      <div className={styles.flagCountNumber} style={{ color }}>
        {n}
      </div>
      <div className={styles.flagCountLabel}>{label}</div>
    </div>
  );
}

// ── Reusable sections ─────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionLabel}>{title}</h3>
      <div className={styles.sectionCard}>{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const mute = !value;
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span
        className={`${styles.detailValue} ${mute ? styles.detailValueMute : ''}`}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

function EmptySection({ label }: { label: string }) {
  return <div className={styles.empty}>{label}</div>;
}

// ── Notes (local state — Phase 11 wires persistence) ──────────────

interface Note {
  id: number;
  author: string;
  date: string;
  text: string;
  resolved: boolean;
}

const SEED_NOTES: Note[] = [
  {
    id: 1,
    author: 'Sarah Chen',
    date: '2026-04-11',
    text: 'Check if liability cap is negotiable before next review.',
    resolved: false,
  },
];

function NotesSection() {
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [draft, setDraft] = useState('');

  const addNote = () => {
    const text = draft.trim();
    if (!text) return;
    setNotes((ns) => [
      ...ns,
      {
        id: Date.now(),
        author: 'You',
        date: new Date().toISOString().slice(0, 10),
        text,
        resolved: false,
      },
    ]);
    setDraft('');
  };

  const markResolved = (id: number) => {
    setNotes((ns) =>
      ns.map((n) => (n.id === id ? { ...n, resolved: true } : n)),
    );
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionLabel}>Notes</h3>
      <ul className={styles.notesList}>
        {notes.map((n) => (
          <li key={n.id} className={styles.note}>
            <p className={styles.noteHeader}>
              <span className={styles.noteAuthor}>{n.author}</span> · {n.date}
              {n.resolved && <span className={styles.noteResolved}>✓ Resolved</span>}
            </p>
            <p className={styles.noteText}>{n.text}</p>
            {!n.resolved && (
              <button
                type="button"
                className={styles.markResolved}
                onClick={() => markResolved(n.id)}
              >
                Mark resolved
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className={styles.noteInputRow}>
        <input
          className={styles.noteInput}
          type="text"
          placeholder="Add a note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addNote();
            }
          }}
          aria-label="Add a note"
        />
        <Button size="sm" onClick={addNote}>
          Add
        </Button>
      </div>
    </section>
  );
}
