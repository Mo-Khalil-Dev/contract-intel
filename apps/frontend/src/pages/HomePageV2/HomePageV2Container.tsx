import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReferenceData } from '@/hooks/useReferenceData';
import { HomePageV2 } from './HomePageV2';
import { track } from '@/analytics';
import type { AnalyticsEventPayloads } from '@/analytics';

type NavDestination = AnalyticsEventPayloads['top_nav_link_clicked']['destination'];
const NAV_DESTINATIONS: readonly NavDestination[] = [
  'portfolio',
  'playbook',
  'compare',
  'renewals',
  'settings',
] as const;

/**
 * Fetches the DashboardViewModel via the shared useReferenceData hook
 * and renders the HomePageV2 view. Handles loading / error states with
 * intentionally minimal markup — the experiment is about the loaded page.
 */
export function HomePageV2Container() {
  const { data: vm, isLoading, error } = useReferenceData();
  const navigate = useNavigate();

  useEffect(() => {
    if (vm && !isLoading) {
      track('dashboard_viewed', {
        critical_flag_count: vm.kpis.criticalFlagCount,
        urgent_renewal_count: vm.kpis.urgentRenewalCount,
        active_contract_count: vm.kpis.activeContractCount,
      });
    }
  }, [vm, isLoading]);

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
    if (id === 'upload') {
      track('dashboard_upload_cta_clicked', { source: 'top_nav' });
      navigate('/upload');
      return;
    }
    if (id === 'home') {
      navigate('/v2');
      return;
    }
    if (id === 'results') {
      track('resume_contract_clicked');
      // Real /results screen lands in a later phase.
      // eslint-disable-next-line no-console
      console.info('[HomePageV2] nav → results (no route yet)');
      return;
    }
    if (NAV_DESTINATIONS.includes(id as NavDestination)) {
      track('top_nav_link_clicked', { destination: id as NavDestination });
    }
    if (id === 'portfolio') {
      navigate('/contracts');
      return;
    }
    // eslint-disable-next-line no-console
    console.info('[HomePageV2] nav →', id, '(no route yet)');
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
