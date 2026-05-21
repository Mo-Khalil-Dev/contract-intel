import { SearchIcon } from '@/components/core/icons';
import { SUGGESTED_QUERIES } from '@/services/semanticSearchService';

export interface SuggestedSearchesProps {
  onSelect: (query: string) => void;
}

/**
 * Idle-state list of canned example queries for the SearchOverlay.
 * Clicking a suggestion populates the input — does NOT auto-submit,
 * because the debounce in useSemanticSearch will kick in naturally
 * (consistent UX with typing the same query manually).
 *
 * Queries themselves live in the service so the curated set stays
 * next to the canned results.
 */
export function SuggestedSearches({ onSelect }: SuggestedSearchesProps) {
  return (
    <div>
      <div
        className="text-ink-mute mb-3 text-[10px] font-bold uppercase"
        style={{ letterSpacing: '0.08em' }}
      >
        Try searching…
      </div>
      <ul className="space-y-2">
        {SUGGESTED_QUERIES.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onSelect(q)}
              className="border-border bg-surface hover:bg-bg-alt focus-visible:bg-bg-alt flex w-full items-center gap-3 rounded-[10px] border px-3.5 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            >
              <SearchIcon
                aria-hidden="true"
                className="text-ink-mute h-4 w-4 shrink-0"
              />
              <span
                className="text-ink-mid text-[13.5px]"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                &ldquo;{q}&rdquo;
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
