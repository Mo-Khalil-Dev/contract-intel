import { useEffect, useState } from 'react';
import { SearchIcon } from '@/components/core/icons';
import { SearchOverlay } from '../SearchOverlay';

/**
 * Top-nav search trigger + the global ⌘K / Ctrl+K shortcut listener.
 *
 * Renders as a button styled to look like a flat search input
 * embedded in the dark top nav — a deliberate "looks-like-input"
 * affordance per the design handoff. Real typing happens in the
 * overlay that opens when clicked or when the user presses the
 * shortcut from anywhere in the app (including text inputs — search
 * is the one global shortcut that overrides input focus, per the
 * spec).
 */
export function GlobalSearchBar() {
  const [open, setOpen] = useState(false);
  const isMac = useIsMac();

  // ⌘K / Ctrl+K opens from anywhere — overrides text-input focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (cmd && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMac]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search your contracts"
        className="group inline-flex h-9 w-full max-w-[480px] items-center gap-3 rounded-lg border px-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
        style={{
          background: 'rgba(255,255,255,0.06)',
          borderColor: 'rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        <SearchIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate text-[13px]">
          Search your contracts in plain English…
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <KbdChip>{isMac ? '⌘' : 'Ctrl'}</KbdChip>
          <KbdChip>K</KbdChip>
        </span>
      </button>
      <SearchOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function KbdChip({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="flex h-5 min-w-[20px] items-center justify-center rounded px-1 font-mono text-[10px] font-semibold"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.7)',
      }}
    >
      {children}
    </kbd>
  );
}

function useIsMac(): boolean {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    // Defer to client side — avoids SSR surprises and platform sniffing
    // at module import time.
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);
  return isMac;
}
