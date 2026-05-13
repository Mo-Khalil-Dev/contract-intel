import { colors } from '@/config/designTokens';

export type SystemStatus = 'operational' | 'degraded' | 'outage';

export interface UseOrgBannerProps {
  orgName: string;
  workspaceTag?: string;
  status?: SystemStatus;
}

export interface UseOrgBannerResult {
  statusColor: string;
  statusText: string;
}

const statusMap: Record<SystemStatus, { color: string; text: string }> = {
  operational: { color: colors.green, text: 'All systems operational' },
  degraded: { color: colors.orange, text: 'Degraded performance' },
  outage: { color: colors.red, text: 'Service outage' },
};

export function useOrgBanner({ status = 'operational' }: UseOrgBannerProps): UseOrgBannerResult {
  return {
    statusColor: statusMap[status].color,
    statusText: statusMap[status].text,
  };
}
