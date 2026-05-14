import { Button } from '@/components/ui/button';
import styles from './GreetingSection.module.css';

interface GreetingSectionProps {
  displayName: string;
  criticalFlagCount: number;
  urgentRenewalCount: number;
  onUpload: () => void;
  onViewAll: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingSection({
  displayName,
  criticalFlagCount,
  urgentRenewalCount,
  onUpload,
  onViewAll,
}: GreetingSectionProps) {
  const greeting = getGreeting();

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>{greeting}, {displayName}.</h1>
          <p className={styles.context}>
            You have{' '}
            <span className={styles.critical}>
              {criticalFlagCount} critical flag{criticalFlagCount !== 1 ? 's' : ''}
            </span>
            {' across your portfolio and '}
            <span className={styles.urgent}>
              {urgentRenewalCount} urgent renewal{urgentRenewalCount !== 1 ? 's' : ''}
            </span>
            {' in the next 60 days.'}
          </p>
        </div>

        <div className={styles.actions}>
          <Button variant="outline" size="lg" className="px-6" onClick={onViewAll}>
            View all contracts
          </Button>
          <Button size="lg" className="px-6" onClick={onUpload}>
            + Upload contract
          </Button>
        </div>
      </div>
    </section>
  );
}
