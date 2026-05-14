import { Injectable } from '@nestjs/common';

export interface MockContract {
  id: string;
  name: string;
  type: 'vendor' | 'license' | 'partnership' | 'customer' | 'lease' | 'nda';
  party: string;
  flagCount: number;
  riskScore: number;
  status: 'active' | 'in_progress' | 'expired';
  uploadedAt: Date;
}

export interface MockRenewal {
  id: string;
  contractName: string;
  party: string;
  renewalDate: Date;
  daysRemaining: number;
  urgency?: 'critical' | 'high' | 'medium';
}

@Injectable()
export class DashboardMetricsService {
  private readonly mockContracts: MockContract[] = [
    {
      id: 'contract-001',
      name: 'Acme Corp Vendor Agreement',
      type: 'vendor',
      party: 'Acme Corporation',
      flagCount: 2,
      riskScore: 72,
      status: 'active',
      uploadedAt: new Date('2026-05-10'),
    },
    {
      id: 'contract-002',
      name: 'CloudHost SaaS License',
      type: 'license',
      party: 'CloudHost Inc.',
      flagCount: 0,
      riskScore: 28,
      status: 'active',
      uploadedAt: new Date('2026-05-08'),
    },
    {
      id: 'contract-003',
      name: 'TechParts Strategic Partnership',
      type: 'partnership',
      party: 'TechParts Ltd',
      flagCount: 5,
      riskScore: 68,
      status: 'in_progress',
      uploadedAt: new Date('2026-05-05'),
    },
    {
      id: 'contract-004',
      name: 'DataFlow Customer Agreement',
      type: 'customer',
      party: 'DataFlow Systems',
      flagCount: 0,
      riskScore: 15,
      status: 'active',
      uploadedAt: new Date('2026-04-30'),
    },
    {
      id: 'contract-005',
      name: 'BuildSpace Office Lease',
      type: 'lease',
      party: 'BuildSpace Properties',
      flagCount: 2,
      riskScore: 35,
      status: 'active',
      uploadedAt: new Date('2026-04-20'),
    },
  ];

  private readonly mockRenewals: MockRenewal[] = [
    {
      id: 'renewal-001',
      contractName: 'Acme Corp Vendor Agreement',
      party: 'Acme Corporation',
      renewalDate: new Date('2026-05-25'),
      daysRemaining: 11,
    },
    {
      id: 'renewal-002',
      contractName: 'CloudHost SaaS License',
      party: 'CloudHost Inc.',
      renewalDate: new Date('2026-06-10'),
      daysRemaining: 27,
    },
    {
      id: 'renewal-003',
      contractName: 'TechParts Strategic Partnership',
      party: 'TechParts Ltd',
      renewalDate: new Date('2026-07-15'),
      daysRemaining: 62,
    },
    {
      id: 'renewal-004',
      contractName: 'DataFlow Customer Agreement',
      party: 'DataFlow Systems',
      renewalDate: new Date('2026-08-20'),
      daysRemaining: 98,
    },
  ];

  calculateActiveContractCount(): number {
    return this.mockContracts.filter((c) => c.status === 'active').length;
  }

  calculateInProgressCount(): number {
    return this.mockContracts.filter((c) => c.status === 'in_progress').length;
  }

  calculateAvgRiskScore(): number {
    if (this.mockContracts.length === 0) return 0;
    const sum = this.mockContracts.reduce((acc, c) => acc + c.riskScore, 0);
    return Math.round(sum / this.mockContracts.length);
  }

  calculateCriticalFlagCount(): number {
    return this.mockContracts.reduce((acc, c) => acc + c.flagCount, 0);
  }

  calculateUrgentRenewalCount(): number {
    return this.mockRenewals.filter((r) => r.daysRemaining < 60).length;
  }

  getRecentContracts(): MockContract[] {
    return [...this.mockContracts]
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .slice(0, 4);
  }

  getUrgentRenewals(): MockRenewal[] {
    return [...this.mockRenewals]
      .map((r) => ({
        ...r,
        urgency: this.assignUrgencyLevel(r.daysRemaining),
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 3);
  }

  private assignUrgencyLevel(daysRemaining: number): 'critical' | 'high' | 'medium' {
    if (daysRemaining < 30) return 'critical';
    if (daysRemaining < 60) return 'high';
    return 'medium';
  }
}
