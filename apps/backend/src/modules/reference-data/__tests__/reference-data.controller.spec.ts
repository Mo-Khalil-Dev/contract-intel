import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { ReferenceDataController } from '../infrastructure/reference-data.controller';
import { ReferenceDataViewModel } from '../application/queries/get-reference-data.handler';
import { RequestUser } from '../../auth/infrastructure/decorators/current-user.decorator';


describe('ReferenceDataController', () => {
  let controller: ReferenceDataController;

  const mockViewModel: ReferenceDataViewModel = {
    user: {
      userId: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    kpis: {
      activeContractCount: 4,
      inProgressCount: 1,
      avgRiskScore: 44,
      criticalFlagCount: 9,
      urgentRenewalCount: 2,
    },
    recentContracts: [
      {
        id: 'contract-001',
        name: 'Acme Corp Vendor Agreement',
        type: 'vendor',
        party: 'Acme Corporation',
        flagCount: 2,
        riskScore: 72,
        uploadedAt: new Date('2026-05-10'),
      },
    ],
    urgentRenewals: [
      {
        id: 'renewal-001',
        contractName: 'Acme Corp Vendor Agreement',
        party: 'Acme Corporation',
        renewalDate: new Date('2026-05-25'),
        daysRemaining: 11,
        urgency: 'critical',
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferenceDataController],
      providers: [
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn().mockResolvedValue(mockViewModel),
          },
        },
      ],
    }).compile();

    controller = module.get<ReferenceDataController>(ReferenceDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getReferenceData', () => {
    it('should return complete reference data with all KPIs', async () => {
      const user: RequestUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        sessionId: 'session-123',
      };

      const result = await controller.getReferenceData(user);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.user).toBeDefined();
      expect(result.data.user.userId).toBe('user-123');
      expect(result.data.user.email).toBe('test@example.com');
    });

    it('should include all required KPI fields', async () => {
      const user: RequestUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        sessionId: 'session-123',
      };

      const result = await controller.getReferenceData(user);

      expect(result.data.kpis).toBeDefined();
      expect(result.data.kpis).toHaveProperty('activeContractCount');
      expect(result.data.kpis).toHaveProperty('inProgressCount');
      expect(result.data.kpis).toHaveProperty('avgRiskScore');
      expect(result.data.kpis).toHaveProperty('criticalFlagCount');
      expect(result.data.kpis).toHaveProperty('urgentRenewalCount');
    });

    it('should return at most 4 recent contracts', async () => {
      const user: RequestUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        sessionId: 'session-123',
      };

      const result = await controller.getReferenceData(user);

      expect(result.data.recentContracts).toBeDefined();
      expect(result.data.recentContracts.length).toBeLessThanOrEqual(4);
    });

    it('should return at most 3 urgent renewals', async () => {
      const user: RequestUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        sessionId: 'session-123',
      };

      const result = await controller.getReferenceData(user);

      expect(result.data.urgentRenewals).toBeDefined();
      expect(result.data.urgentRenewals.length).toBeLessThanOrEqual(3);
    });

    it('should include backend-driven UI configuration', async () => {
      const user: RequestUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        sessionId: 'session-123',
      };

      const result = await controller.getReferenceData(user);

      expect(result.actions).toBeDefined();
      expect(result.actions.canUploadDocument).toBe(true);
      expect(result.actions.canViewContracts).toBe(true);
      expect(result.actions.canViewRenewals).toBe(true);

      expect(result.ui).toBeDefined();
      expect(result.ui.orgBannerText).toBeDefined();
      expect(result.ui.systemStatus).toBeDefined();
      expect(result.ui.systemStatusColor).toBeDefined();
    });
  });
});
