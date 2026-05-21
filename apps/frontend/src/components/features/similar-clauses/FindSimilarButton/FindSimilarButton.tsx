import { SearchIcon } from '@/components/core/icons';

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
 * Compact secondary button that lives on each clause card. Opens the
 * SimilarClausesDrawer for that clause. The trigger is intentionally
 * small — clause cards already have other actions, and Similar Clauses
 * is a "research" affordance, not a primary CTA.
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
        'border-border text-inkMid hover:bg-surfaceAlt hover:text-ink',
        'inline-flex items-center gap-1.5 rounded-md border bg-surface px-2.5 py-1 text-xs font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue',
        'disabled:cursor-wait disabled:opacity-60',
      ].join(' ')}
    >
      {isLoading ? (
        <span
          className="border-inkMute border-t-blue h-3 w-3 animate-spin rounded-full border-2"
          role="status"
          aria-label="Finding similar clauses"
        />
      ) : (
        <SearchIcon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span>{isLoading ? 'Finding…' : 'Find similar'}</span>
    </button>
  );
}
