import { Button } from './components/Button';
import { DarkCallToActionCard } from './components/DarkCallToActionCard';
import { KpiCard } from './components/KpiCard';
import { OrgBanner } from './components/OrgBanner';
import { PlaybookAndContacts } from './components/PlaybookAndContacts';
import { ProcessSteps } from './components/ProcessSteps';
import { RecentContractsCard } from './components/RecentContractsCard';
import { ResumeCard, LinkCard } from './components/SideCard';
import { RiskBadge } from './components/RiskBadge';
import { TopNav } from './components/TopNav';
import { UpcomingRenewalsCard } from './components/UpcomingRenewalsCard';
import { riskColor, T } from './tokens';
import type { DashboardViewModel } from './types';
import styles from './HomePageV2.module.css';

interface HomePageV2Props {
  vm: DashboardViewModel;
  userInitials: string;
  greetingName: string;
  onNav: (id: string) => void;
}

function formatNextRenewal(raw: string | Date | undefined): string {
  if (!raw) return '—';
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * Pure presentational page — accepts a DashboardViewModel and renders
 * the entire Home/Dashboard screen described in
 * wirframes/version_02/design_handoff_ci_redesign/screens-a.jsx
 * (HomeScreen).
 */
export function HomePageV2({ vm, userInitials, greetingName, onNav }: HomePageV2Props) {
  const { kpis, recentContracts, urgentRenewals, lastOpenedContract } = vm;

  const hasCriticalUrgent = urgentRenewals[0]?.urgency === 'critical';

  return (
    <div className={styles.root}>
      <TopNav active="home" userInitials={userInitials} onNav={onNav} />
      <OrgBanner
        orgName="Northwind Holdings Ltd"
        workspace="Legal Operations · Contract Review Workspace"
      />

      <div className={styles.body}>
        {/* Greeting + primary actions */}
        <div className={styles.greetingRow}>
          <div>
            <h1 className={styles.h1}>Good morning, {greetingName}.</h1>
            <p className={styles.lede}>
              You have{' '}
              <strong className={styles.callout} style={{ color: T.red }}>
                {kpis.criticalFlagCount} critical flags
              </strong>{' '}
              across your portfolio and{' '}
              <strong
                className={styles.callout}
                style={{ color: hasCriticalUrgent ? T.orange : T.ink }}
              >
                {kpis.urgentRenewalCount} urgent renewals
              </strong>{' '}
              in the next 60 days.
            </p>
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => onNav('portfolio')}>
              View all contracts
            </Button>
            <Button onClick={() => onNav('upload')}>+ Upload contract</Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className={styles.kpiGrid}>
          <KpiCard
            label="Active contracts"
            value={kpis.activeContractCount}
            sub={`${kpis.inProgressCount} in review`}
          />
          <KpiCard
            label="Average risk score"
            value={kpis.avgRiskScore}
            sub={
              kpis.avgRiskScore >= 70
                ? 'High — review needed'
                : kpis.avgRiskScore >= 40
                  ? 'Medium'
                  : 'Low'
            }
            valueColor={riskColor(kpis.avgRiskScore)}
          />
          <KpiCard
            label="Critical flags open"
            value={kpis.criticalFlagCount}
            sub="Across all contracts"
            valueColor={T.red}
          />
          <KpiCard
            label="Renewals < 60 days"
            value={kpis.urgentRenewalCount}
            sub={
              urgentRenewals[0]
                ? `Next: ${formatNextRenewal(urgentRenewals[0].renewalDate)}`
                : '—'
            }
            valueColor={T.orange}
          />
        </div>

        {/* Where to start */}
        <div className={styles.whereToStart}>
          <DarkCallToActionCard onUpload={() => onNav('upload')} />
          <div className={styles.sideStack}>
            {lastOpenedContract && (
              <ResumeCard
                eyebrow="Pick up where you left off"
                title={lastOpenedContract.name.replace(/\.[^.]+$/, '')}
                meta={
                  <>
                    <RiskBadge score={lastOpenedContract.riskScore} />
                    <span>·</span>
                    <span>last viewed yesterday</span>
                  </>
                }
                onClick={() => onNav('results')}
              />
            )}
            <LinkCard
              title="Browse the contract register"
              sub={`${kpis.activeContractCount} contracts on file`}
              onClick={() => onNav('portfolio')}
            />
            <LinkCard
              title="Review upcoming renewals"
              sub={`${kpis.urgentRenewalCount} need attention this quarter`}
              onClick={() => onNav('renewals')}
            />
          </div>
        </div>

        {/* Recent + Renewals */}
        <div className={styles.dataRow}>
          <RecentContractsCard
            contracts={recentContracts}
            onSeeAll={() => onNav('portfolio')}
            onRowClick={() => onNav('portfolio')}
          />
          <UpcomingRenewalsCard
            renewals={urgentRenewals}
            onSeeAll={() => onNav('renewals')}
            onRowClick={() => onNav('renewals')}
          />
        </div>
      </div>

      <ProcessSteps onPolicyClick={() => onNav('settings')} />
      <PlaybookAndContacts />
    </div>
  );
}
