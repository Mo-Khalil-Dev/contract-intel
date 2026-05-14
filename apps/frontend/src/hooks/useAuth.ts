import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authService } from '@/services/authService';
import { User } from '@/types/auth';

export interface UseAuthReturn {
  user: User | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  logoutIsLoading: boolean;
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
    retry: false,
  });

  const logoutMutation = useMutation(authService.logout, {
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: () => logoutMutation.mutate(),
    logoutIsLoading: logoutMutation.isLoading,
  };
}
