import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetReferenceDataQuery } from './get-reference-data.query';
import { DashboardMetricsService } from '../services/dashboard-metrics.service';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/domain/user.repository';
import { UserId } from '../../../auth/domain/value-objects/user-id.vo';

export interface ReferenceDataViewModel {
  user: {
    userId: string;
    email: string;
    displayName?: string;
  };
  kpis: {
    activeContractCount: number;
    inProgressCount: number;
    avgRiskScore: number;
    criticalFlagCount: number;
    urgentRenewalCount: number;
  };
  recentContracts: Array<{
    id: string;
    name: string;
    type: string;
    party: string;
    flagCount: number;
    riskScore: number;
    uploadedAt: Date;
  }>;
  urgentRenewals: Array<{
    id: string;
    contractName: string;
    party: string;
    renewalDate: Date;
    daysRemaining: number;
    urgency: 'critical' | 'high' | 'medium';
  }>;
  lastOpenedContract?: {
    id: string;
    name: string;
  };
}

@QueryHandler(GetReferenceDataQuery)
export class GetReferenceDataHandler implements IQueryHandler<GetReferenceDataQuery> {
  constructor(
    private readonly metrics: DashboardMetricsService,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(query: GetReferenceDataQuery): Promise<ReferenceDataViewModel> {
    const userId = UserId.fromString(query.userId);
    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error(`User ${query.userId} not found`);
    }

    const activeContractCount = this.metrics.calculateActiveContractCount();
    const inProgressCount = this.metrics.calculateInProgressCount();
    const avgRiskScore = this.metrics.calculateAvgRiskScore();
    const criticalFlagCount = this.metrics.calculateCriticalFlagCount();
    const urgentRenewalCount = this.metrics.calculateUrgentRenewalCount();

    const recentContracts = this.metrics.getRecentContracts().map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      party: c.party,
      flagCount: c.flagCount,
      riskScore: c.riskScore,
      uploadedAt: c.uploadedAt,
    }));

    const urgentRenewals = this.metrics.getUrgentRenewals().map((r) => ({
      id: r.id,
      contractName: r.contractName,
      party: r.party,
      renewalDate: r.renewalDate,
      daysRemaining: r.daysRemaining,
      urgency: r.urgency!,
    }));

    return {
      user: {
        userId: user.id.value,
        email: user.email.value,
        displayName: user.displayName,
      },
      kpis: {
        activeContractCount,
        inProgressCount,
        avgRiskScore,
        criticalFlagCount,
        urgentRenewalCount,
      },
      recentContracts,
      urgentRenewals,
      lastOpenedContract: undefined,
    };
  }
}
