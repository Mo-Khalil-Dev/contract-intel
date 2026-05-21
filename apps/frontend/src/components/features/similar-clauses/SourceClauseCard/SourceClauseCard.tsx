import { humaniseClauseType } from '../PrecedentRow/usePrecedentRow';

export interface SourceClauseCardProps {
  type: string;
  textSnippet: string;
  /**
   * Optional click handler — when set, the card becomes interactive
   * (used by the drawer to "return to source clause" while a result
   * row is active). When omitted, it renders as a static block.
   */
  onClick?: () => void;
}

/**
 * Muted compact card showing the source clause at the top of the
 * SimilarClausesDrawer. Visually de-emphasised so the result list is
 * the focus, but the user can always glance up to remember what
 * they're researching.
 *
 * Static when `onClick` is absent. Becomes a button (with hover +
 * focus ring) when `onClick` is set — that mode is how the drawer's
 * "click source to return" interaction works while a result row is
 * active.
 */
export function SourceClauseCard({
  type,
  textSnippet,
  onClick,
}: SourceClauseCardProps) {
  const humanType = humaniseClauseType(type);
  const content = (
    <>
      <div className="text-inkSoft mb-1 text-[10px] font-semibold uppercase tracking-wide">
        Source
      </div>
      <div className="text-inkMid mb-1 text-sm font-semibold">{humanType}</div>
      <p className="text-inkSoft line-clamp-2 text-xs leading-snug">
        {textSnippet}
      </p>
    </>
  );

  const baseClass =
    'block w-full rounded-lg border border-border bg-surfaceAlt px-4 py-3 text-left';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} transition-colors hover:bg-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue`}
      >
        {content}
      </button>
    );
  }
  return <div className={baseClass}>{content}</div>;
}
