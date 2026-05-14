import { ApiProperty } from '@nestjs/swagger';

export class KpiDto {
  constructor(data?: Partial<KpiDto>) {
    Object.assign(this, data);
  }

  @ApiProperty({ example: 4 })
  activeContractCount!: number;

  @ApiProperty({ example: 1 })
  inProgressCount!: number;

  @ApiProperty({ example: 45 })
  avgRiskScore!: number;

  @ApiProperty({ example: 7 })
  criticalFlagCount!: number;

  @ApiProperty({ example: 2 })
  urgentRenewalCount!: number;
}

export class RecentContractDto {
  constructor(data?: Partial<RecentContractDto>) {
    Object.assign(this, data);
  }

  @ApiProperty({ example: 'contract-001' })
  id!: string;

  @ApiProperty({ example: 'Acme Corp Vendor Agreement' })
  name!: string;

  @ApiProperty({ example: 'vendor', enum: ['vendor', 'license', 'partnership', 'customer', 'lease', 'nda'] })
  type!: string;

  @ApiProperty({ example: 'Acme Corporation' })
  party!: string;

  @ApiProperty({ example: 2 })
  flagCount!: number;

  @ApiProperty({ example: 72 })
  riskScore!: number;

  @ApiProperty({ example: '2026-05-10T00:00:00Z' })
  uploadedAt!: Date;
}

export class UrgentRenewalDto {
  constructor(data?: Partial<UrgentRenewalDto>) {
    Object.assign(this, data);
  }

  @ApiProperty({ example: 'renewal-001' })
  id!: string;

  @ApiProperty({ example: 'Acme Corp Vendor Agreement' })
  contractName!: string;

  @ApiProperty({ example: 'Acme Corporation' })
  party!: string;

  @ApiProperty({ example: '2026-05-25T00:00:00Z' })
  renewalDate!: Date;

  @ApiProperty({ example: 11 })
  daysRemaining!: number;

  @ApiProperty({ example: 'critical', enum: ['critical', 'high', 'medium'] })
  urgency!: 'critical' | 'high' | 'medium';
}

export class DashboardDataDto {
  constructor(data?: Partial<DashboardDataDto>) {
    Object.assign(this, data);
  }

  @ApiProperty({
    type: 'object',
    properties: {
      userId: { type: 'string' },
      email: { type: 'string' },
      displayName: { type: 'string' },
    },
  })
  user!: {
    userId: string;
    email: string;
    displayName?: string;
  };

  @ApiProperty({ type: KpiDto })
  kpis!: KpiDto;

  @ApiProperty({ type: [RecentContractDto] })
  recentContracts!: RecentContractDto[];

  @ApiProperty({ type: [UrgentRenewalDto] })
  urgentRenewals!: UrgentRenewalDto[];

  @ApiProperty({ example: null, nullable: true })
  lastOpenedContract?: {
    id: string;
    name: string;
  };
}

export class ReferenceDataResponseDto {
  constructor(data?: Partial<ReferenceDataResponseDto>) {
    Object.assign(this, data);
  }

  @ApiProperty({ type: DashboardDataDto })
  data!: DashboardDataDto;

  @ApiProperty({
    type: 'object',
    properties: {
      canUploadDocument: { type: 'boolean' },
      canViewContracts: { type: 'boolean' },
      canViewRenewals: { type: 'boolean' },
    },
  })
  actions!: {
    canUploadDocument: boolean;
    canViewContracts: boolean;
    canViewRenewals: boolean;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      orgBannerText: { type: 'string' },
      systemStatus: { type: 'string' },
      systemStatusColor: { type: 'string' },
    },
  })
  ui!: {
    orgBannerText: string;
    systemStatus: string;
    systemStatusColor: string;
  };
}
