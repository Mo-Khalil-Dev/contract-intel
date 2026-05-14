import { Button } from '@/components/ui/button';
import { useLogoutButton } from './useLogoutButton';

export function LogoutButton() {
  const { handleLogout, isLoading } = useLogoutButton();

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant="ghost"
      className="min-h-11 min-w-11"
      aria-label="Log out"
    >
      {isLoading ? 'Logging out...' : 'Log out'}
    </Button>
  );
}
