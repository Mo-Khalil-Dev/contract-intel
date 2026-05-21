import { humaniseClauseType } from '../PrecedentRow/usePrecedentRow';

export interface SourceClauseCardProps {
  type: string;
  textSnippet: string;
  /**
   * Optional contract name + section reference. Renders as the meta
   * line `<Contract name> · §<section>` in DM Mono. Both pieces are
   * optional individually.
   */
  contractName?: string;
  sectionRef?: string | null;
  /**
   * When set the card becomes interactive: clicking it deselects any
   * active precedent in the drawer (returning to the "source view"
   * with no row highlighted). When omitted, renders as a static block.
   */
  onClick?: () => void;
  /**
   * Drives the subtle background switch — `active` (no precedent
   * selected) uses the warmer `bg` colour to read as the "live" focus;
   * the default `surfaceAlt` reads as resting.
   */
  active?: boolean;
}

/**
 * Source clause card pinned at the top of the SimilarClausesDrawer.
 * Visually de-emphasised so the result list owns the attention; the
 * uppercase "SOURCE" eyebrow on the right is the orientation cue —
 * a glance up always tells the reviewer what they're researching.
 */
export function SourceClauseCard({
  type,
  textSnippet,
  contractName,
  sectionRef,
  onClick,
  active = false,
}: SourceClauseCardProps) {
  const humanType = humaniseClauseType(type);
  const metaLine = [contractName, sectionRef ? `§${sectionRef}` : null]
    .filter(Boolean)
    .join(' · ');

  const content = (
    <>
      {/* ── Eyebrow row: clause label left, SOURCE pin right ── */}
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <div className="text-ink-soft text-xs font-bold">{humanType}</div>
        <div
          className="text-ink-mute text-[10px] font-bold uppercase"
          style={{ letterSpacing: '0.06em' }}
        >
          Source
        </div>
      </div>

      {/* ── Meta line ─────────────────────────────────────────── */}
      {metaLine && (
        <div className="text-ink-soft font-mono text-[11px] mb-1.5">
          {metaLine}
        </div>
      )}

      {/* ── Snippet (Georgia italic, 2-line clamp) ───────────── */}
      <p
        className="m-0 text-ink-mid line-clamp-2"
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 12,
          lineHeight: 1.55,
        }}
      >
        &ldquo;{textSnippet}&rdquo;
      </p>
    </>
  );

  const baseClass = [
    'block w-full rounded-[10px] border border-border px-4 py-3 text-left',
    active ? 'bg-bg' : 'bg-surface-alt',
  ].join(' ');

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} transition-colors hover:bg-bg-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-blue`}
      >
        {content}
      </button>
    );
  }
  return <div className={baseClass}>{content}</div>;
}
