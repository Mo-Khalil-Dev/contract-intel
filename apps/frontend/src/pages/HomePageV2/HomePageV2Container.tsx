import { useMemo } from 'react';
import { useReferenceData } from '@/hooks/useReferenceData';
import { HomePageV2 } from './HomePageV2';

/**
 * Fetches the DashboardViewModel via the shared useReferenceData hook
 * and renders the HomePageV2 view. Handles loading / error states with
 * intentionally minimal markup — the experiment is about the loaded page.
 */
export function HomePageV2Container() {
  const { data: vm, isLoading, error } = useReferenceData();

  const greetingName = useMemo(() => {
    const raw = vm?.user.displayName?.trim() || vm?.user.email || 'there';
    return raw.split(/[\s@]/)[0]; // first name, or local-part of email
  }, [vm]);

  const userInitials = useMemo(() => {
    const source = vm?.user.displayName?.trim() || vm?.user.email || 'U';
    const parts = source.split(/\s+/).slice(0, 2);
    const initials = parts
      .map((p) => p[0] ?? '')
      .join('')
      .toUpperCase();
    return initials.slice(0, 2) || 'U';
  }, [vm]);

  function handleNav(id: string) {
    // Sibling routes (portfolio / renewals / etc.) don't exist yet —
    // log so the user can see clicks register without 404ing the SPA.
    // eslint-disable-next-line no-console
    console.info('[HomePageV2] nav →', id);
  }

  if (isLoading || !vm) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#fafaf9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif",
          color: '#64748b',
          fontSize: 14,
        }}
      >
        Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#fafaf9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif",
          color: '#ef4444',
          fontSize: 14,
        }}
      >
        Couldn&apos;t load the dashboard.
      </div>
    );
  }

  return (
    <HomePageV2 vm={vm} greetingName={greetingName} userInitials={userInitials} onNav={handleNav} />
  );
}
