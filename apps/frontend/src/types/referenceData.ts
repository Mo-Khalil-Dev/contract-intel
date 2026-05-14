export interface RecentContractItem {
  id: string;
  name: string;
  type: 'vendor' | 'license' | 'lease' | 'nda' | 'partnership' | 'customer';
  party: string;
  flagCount: number;
  riskScore: number;
  uploadedAt: string | Date;
}

export interface UrgentRenewalItem {
  id: string;
  contractName: string;
  party: string;
  renewalDate: string | Date;
  daysRemaining: number;
  urgency: 'critical' | 'high' | 'medium';
}

export interface DashboardKpis {
  activeContractCount: number;
  inProgressCount: number;
  avgRiskScore: number;
  criticalFlagCount: number;
  urgentRenewalCount: number;
}

export interface DashboardViewModel {
  user: {
    userId: string;
    email: string;
    displayName?: string;
  };
  kpis: DashboardKpis;
  recentContracts: RecentContractItem[];
  urgentRenewals: UrgentRenewalItem[];
  lastOpenedContract?: RecentContractItem | null;
}
