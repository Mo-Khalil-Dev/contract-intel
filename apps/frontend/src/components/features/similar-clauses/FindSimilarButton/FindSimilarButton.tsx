export interface FindSimilarButtonProps {
  onClick: () => void;
  /** Renders a spinner + disables the button while a fetch is in flight. */
  isLoading?: boolean;
  /**
   * Hide the trigger entirely when the clause has no embedding (US-CI-1
   * AC6). A disabled trigger would advertise a feature the user can't
   * use; the right move is to omit it.
   */
  hidden?: boolean;
}

/**
 * Compact secondary button on each ClauseCard. Opens the
 * SimilarClausesDrawer for that clause. The icon is a small compass —
 * "find direction" reads better than a magnifier for a precedent-lookup
 * affordance (the magnifier is reserved for global search).
 *
 * Visual matches the Claude Design handoff: transparent surface, blue
 * text, blue-light hover. Stays small so it doesn't compete with the
 * clause card's own actions.
 */
export function FindSimilarButton({
  onClick,
  isLoading = false,
  hidden = false,
}: FindSimilarButtonProps) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      title="Find 5 most similar clauses across your portfolio (F)"
      className={[
        'inline-flex items-center gap-1.5 rounded-[7px] border border-border bg-surface px-2.5 py-1 text-xs font-semibold transition-colors',
        'text-blue hover:border-blue-mid hover:bg-blue-light',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue',
        'disabled:cursor-wait disabled:opacity-60',
      ].join(' ')}
    >
      {isLoading ? (
        <span
          className="border-ink-mute border-t-blue h-2.5 w-2.5 animate-spin rounded-full border-[1.5px]"
          role="status"
          aria-label="Finding similar clauses"
        />
      ) : (
        <CompassIcon />
      )}
      <span>{isLoading ? 'Finding…' : 'Find similar'}</span>
    </button>
  );
}

/**
 * Inline compass SVG. Inlined (not in the icons module) because it's
 * scoped to this single trigger and the icons module only re-exports
 * Lucide. If FindSimilarButton ever needs the icon in another place
 * we'll promote it.
 */
function CompassIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.5 4.5 8 8 4.5 9.5 6 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
