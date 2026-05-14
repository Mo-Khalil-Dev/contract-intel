import { useAuth } from '@/hooks/useAuth';

export function useLogoutButton() {
  const { logout, logoutIsLoading } = useAuth();

  return {
    handleLogout: logout,
    isLoading: logoutIsLoading,
  };
}
