import { useCallback, useRef } from 'react';
import { track } from './track';
import type { AnalyticsEventName, AnalyticsEventPayloads } from './events';

interface HoverHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const DEFAULT_DWELL_MS = 500;

/**
 * Track a "user hovered with intent" event — only fires if the cursor
 * stays over the element for at least `dwellMs` (default 500ms).
 *
 * Cursors brushing past the element while travelling somewhere else
 * are ignored. This keeps the event volume sensible.
 *
 * @example
 *   const hover = useHoverTracker('dashboard_kpi_hovered', { kpi: 'critical_flags' });
 *   <div {...hover}>...</div>
 */
export function useHoverTracker<E extends AnalyticsEventName>(
  event: E,
  ...args: AnalyticsEventPayloads[E] extends Record<string, never>
    ? [options?: { dwellMs?: number }]
    : [payload: AnalyticsEventPayloads[E], options?: { dwellMs?: number }]
): HoverHandlers {
  const payloadIsRequired = args.length > 0 && typeof args[0] === 'object' && args[0] !== null;
  const payload = payloadIsRequired ? (args[0] as AnalyticsEventPayloads[E]) : undefined;
  const options = (payloadIsRequired ? args[1] : args[0]) as { dwellMs?: number } | undefined;
  const dwellMs = options?.dwellMs ?? DEFAULT_DWELL_MS;

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedThisHover = useRef(false);

  const onMouseEnter = useCallback(() => {
    if (firedThisHover.current) return;
    timer.current = setTimeout(() => {
      // Cast is safe: track() validates at compile site, runtime just forwards.
      (track as unknown as (e: string, p?: unknown) => void)(event, payload);
      firedThisHover.current = true;
      timer.current = null;
    }, dwellMs);
  }, [event, payload, dwellMs]);

  const onMouseLeave = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    firedThisHover.current = false;
  }, []);

  return { onMouseEnter, onMouseLeave };
}
