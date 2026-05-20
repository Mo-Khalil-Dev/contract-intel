import { useNavigate } from 'react-router-dom';
import { useReferenceData } from '@/hooks/useReferenceData';
import { authService } from '@/services/authService';
import { loginRedirectUrl } from '@/api/client';
import { HomePage } from './HomePage';
import { Skeleton } from '@/components/ui/skeleton';
import styles from './HomePageContainer.module.css';

export function HomePageContainer() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useReferenceData();

  const handleNav = (screen: string, params?: Record<string, string>) => {
    switch (screen) {
      case 'upload':
        navigate('/upload');
        break;
      case 'portfolio':
        navigate('/contracts');
        break;
      case 'results':
        if (params?.contractId) {
          navigate(`/results/${params.contractId}`);
        }
        break;
      case 'renewals':
        if (params?.renewalId) {
          navigate(`/renewals/${params.renewalId}`);
        } else {
          navigate('/renewals');
        }
        break;
      default:
        break;
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore — session may already be invalid. We still want to redirect.
    }
    // Backend clears the session cookie; bounce to login flow on the backend
    // origin (absolute URL — the login route doesn't exist on the SPA host).
    window.location.href = loginRedirectUrl('/');
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.skeleton}>
          <Skeleton className={styles.skeletonGreeting} />
          <Skeleton className={styles.skeletonKpi} />
          <Skeleton className={styles.skeletonKpi} />
          <Skeleton className={styles.skeletonKpi} />
          <Skeleton className={styles.skeletonKpi} />
          <Skeleton className={styles.skeletonSection} />
          <Skeleton className={styles.skeletonSection} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h1 className={styles.errorTitle}>Unable to load dashboard</h1>
          <p className={styles.errorMessage}>
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h1 className={styles.errorTitle}>No data available</h1>
          <p className={styles.errorMessage}>
            Unable to retrieve dashboard data. Please try again.
          </p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <HomePage
      data={data}
      displayUser={{
        name: data.user.displayName || 'User',
        email: data.user.email,
      }}
      onNav={handleNav}
      onSignOut={handleSignOut}
    />
  );
}
