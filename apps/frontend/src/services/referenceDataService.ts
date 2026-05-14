import { httpService } from '@/api/httpService';
import { API } from '@/api/endpoints';
import { unwrap } from '@/api/unwrap';
import { DashboardViewModel } from '@/types/referenceData';

export const referenceDataService = {
  getDashboard: (): Promise<DashboardViewModel> =>
    httpService.get<DashboardViewModel>(API.REFERENCE_DATA).then(unwrap),
};
