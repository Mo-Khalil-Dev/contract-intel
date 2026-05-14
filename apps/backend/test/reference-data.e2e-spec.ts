import { Test, TestingModule } from '@nestjs/testing';
import { APP_INTERCEPTOR } from '@nestjs/core';
import request from 'supertest';
import { ResponseInterceptor } from '../src/shared/infrastructure/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/shared/exceptions/http-exception.filter';
import { ReferenceDataController } from '../src/modules/reference-data/infrastructure/reference-data.controller';
import { QueryBus } from '@nestjs/cqrs';

describe('Reference Data E2E (GET /reference-data)', () => {
  let app: any;

  const mockData = {
    user: {
      userId: '550e8400-e29b-41d4-a716-446655440000',
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

  beforeAll(async () => {
    const mockQueryBus = {
      execute: jest.fn().mockResolvedValue(mockData),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ReferenceDataController],
      providers: [
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    // The controller reads `request.user.userId` via @CurrentUser. The
    // auth guard isn't mounted in this test setup, so inject a stub
    // user — otherwise every route 500s. (Pre-existing gap surfaced
    // when the documents e2e suite was added.)
    app.use((req: any, _res: any, next: any) => {
      req.user = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /reference-data', () => {
    it('should return 200 with complete dashboard data', async () => {
      const response = await request(app.getHttpServer()).get('/reference-data').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            userId: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            displayName: 'Test User',
          }),
          kpis: expect.objectContaining({
            activeContractCount: 4,
            inProgressCount: 1,
            avgRiskScore: 44,
            criticalFlagCount: 9,
            urgentRenewalCount: 2,
          }),
          recentContracts: expect.any(Array),
          urgentRenewals: expect.any(Array),
        }),
        actions: expect.objectContaining({
          canUploadDocument: true,
          canViewContracts: true,
          canViewRenewals: true,
        }),
        ui: expect.objectContaining({
          orgBannerText: expect.any(String),
          systemStatus: expect.any(String),
          systemStatusColor: expect.any(String),
        }),
        meta: null,
      });
    });

    it('should return at most 4 recent contracts', async () => {
      const response = await request(app.getHttpServer()).get('/reference-data').expect(200);

      expect(response.body.data.recentContracts).toBeDefined();
      expect(response.body.data.recentContracts.length).toBeLessThanOrEqual(4);
    });

    it('should return at most 3 urgent renewals', async () => {
      const response = await request(app.getHttpServer()).get('/reference-data').expect(200);

      expect(response.body.data.urgentRenewals).toBeDefined();
      expect(response.body.data.urgentRenewals.length).toBeLessThanOrEqual(3);
    });

    it('should have correct contract structure', async () => {
      const response = await request(app.getHttpServer()).get('/reference-data').expect(200);

      if (response.body.data.recentContracts.length > 0) {
        const contract = response.body.data.recentContracts[0];
        expect(contract).toHaveProperty('id');
        expect(contract).toHaveProperty('name');
        expect(contract).toHaveProperty('type');
        expect(contract).toHaveProperty('party');
        expect(contract).toHaveProperty('flagCount');
        expect(contract).toHaveProperty('riskScore');
        expect(contract).toHaveProperty('uploadedAt');
      }
    });

    it('should have correct renewal structure', async () => {
      const response = await request(app.getHttpServer()).get('/reference-data').expect(200);

      if (response.body.data.urgentRenewals.length > 0) {
        const renewal = response.body.data.urgentRenewals[0];
        expect(renewal).toHaveProperty('id');
        expect(renewal).toHaveProperty('contractName');
        expect(renewal).toHaveProperty('party');
        expect(renewal).toHaveProperty('renewalDate');
        expect(renewal).toHaveProperty('daysRemaining');
        expect(renewal).toHaveProperty('urgency');
      }
    });
  });
});
