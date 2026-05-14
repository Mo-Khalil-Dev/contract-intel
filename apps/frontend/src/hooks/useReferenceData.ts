import { useQuery } from 'react-query';
import { referenceDataService } from '@/services/referenceDataService';
import { DashboardViewModel } from '@/types/referenceData';

export function useReferenceData() {
  return useQuery<DashboardViewModel>({
    queryKey: ['reference-data'],
    queryFn: referenceDataService.getDashboard,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
}
