import { DashboardViewModel } from '@/types/referenceData';
import { PageShell } from '@/components/layout/PageShell';
import { TopNav } from '@/components/layout/TopNav';
import { OrgBanner } from '@/components/layout/OrgBanner';
import { GreetingSection } from './sections/GreetingSection/GreetingSection';
import { KpiCardsSection } from './sections/KpiCardsSection/KpiCardsSection';
import { WhereToStartSection } from './sections/WhereToStartSection/WhereToStartSection';
import { HowItWorksSection } from './sections/HowItWorksSection/HowItWorksSection';
import { RecentContractsSection } from './sections/RecentContractsSection/RecentContractsSection';
import { UrgentRenewalsSection } from './sections/UrgentRenewalsSection/UrgentRenewalsSection';
import styles from './HomePage.module.css';

interface HomePageProps {
  data: DashboardViewModel;
  displayUser?: { name: string; email: string };
  onNav: (screen: string, params?: Record<string, string>) => void;
  onSignOut: () => void;
}

export function HomePage({ data, displayUser, onNav, onSignOut }: HomePageProps) {
  const navLinks = [
    { href: '/', label: 'Home', current: true },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/renewals', label: 'Renewals' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <PageShell
      header={
        <>
          <TopNav links={navLinks} user={displayUser} onSignOut={onSignOut} />
          <OrgBanner
            orgName="Northwind Holdings Ltd"
            workspaceTag="Legal Operations · Contract Review Workspace"
          />
        </>
      }
    >
      <div className={styles.container}>
        <GreetingSection
          displayName={data.user.displayName || 'User'}
          criticalFlagCount={data.kpis.criticalFlagCount}
          urgentRenewalCount={data.kpis.urgentRenewalCount}
          onUpload={() => onNav('upload')}
          onViewAll={() => onNav('portfolio')}
        />

        <KpiCardsSection kpis={data.kpis} />

        <WhereToStartSection
          lastOpenedContract={data.lastOpenedContract}
          onUpload={() => onNav('upload')}
        />

        <HowItWorksSection />

        <div className={styles.tablesGrid}>
          <RecentContractsSection
            contracts={data.recentContracts}
            onSelectContract={(contractId) => onNav('results', { contractId })}
          />

          <UrgentRenewalsSection
            renewals={data.urgentRenewals}
            onSelectRenewal={(renewalId) => onNav('renewals', { renewalId })}
          />
        </div>
      </div>
    </PageShell>
  );
}
