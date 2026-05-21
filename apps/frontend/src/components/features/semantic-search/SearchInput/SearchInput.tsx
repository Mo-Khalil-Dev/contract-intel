import { forwardRef } from 'react';
import { SearchIcon, CloseIcon } from '@/components/core/icons';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Auto-focus on mount; pass true for the overlay and /search input. */
  autoFocus?: boolean;
  isLoading?: boolean;
  /** Optional right slot — overlay puts an Esc <kbd> chip here. */
  rightAdornment?: React.ReactNode;
  placeholder?: string;
}

/**
 * Large variant of the search input used inside the SearchOverlay and
 * at the top of the /search page. The compact dark variant in the
 * top nav is a separate component (GlobalSearchBar) because it's a
 * *button* that mimics an input — see the design handoff.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      onChange,
      autoFocus,
      isLoading,
      rightAdornment,
      placeholder = 'Search your contracts in plain English…',
    },
    ref,
  ) {
    return (
      <div className="relative flex w-full items-center">
        <span className="text-ink-mute pointer-events-none absolute left-4 flex items-center">
          {isLoading ? (
            <span
              className="border-ink-mute border-t-blue h-4 w-4 animate-spin rounded-full border-2"
              role="status"
              aria-label="Searching"
            />
          ) : (
            <SearchIcon className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <input
          ref={ref}
          type="search"
          role="searchbox"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="bg-surface text-ink placeholder:text-ink-mute border-border focus:border-blue h-[52px] w-full rounded-xl border pl-12 pr-14 text-base font-medium tracking-[-0.01em] outline-none transition-colors focus:ring-2 focus:ring-blue/20"
        />
        {value && !rightAdornment && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="text-ink-mute hover:text-ink hover:bg-bg-alt absolute right-3 flex h-7 w-7 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            <CloseIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        {rightAdornment && (
          <div className="absolute right-4 flex items-center">
            {rightAdornment}
          </div>
        )}
      </div>
    );
  },
);
