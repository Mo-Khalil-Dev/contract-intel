import { useAuth } from '@/hooks/useAuth';
import { track, reset } from '@/analytics';

export function useLogoutButton() {
  const { logout, logoutIsLoading } = useAuth();

  function handleLogout() {
    track('auth_logout_clicked');
    reset();
    logout();
  }

  return {
    handleLogout,
    isLoading: logoutIsLoading,
  };
}
