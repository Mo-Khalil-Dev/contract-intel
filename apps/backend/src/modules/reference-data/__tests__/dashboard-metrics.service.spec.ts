import { Test, TestingModule } from '@nestjs/testing';
import { DashboardMetricsService } from '../application/services/dashboard-metrics.service';

describe('DashboardMetricsService', () => {
  let service: DashboardMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardMetricsService],
    }).compile();

    service = module.get<DashboardMetricsService>(DashboardMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateActiveContractCount', () => {
    it('should return count of active contracts', () => {
      const count = service.calculateActiveContractCount();
      expect(count).toBe(4);
    });
  });

  describe('calculateInProgressCount', () => {
    it('should return count of in_progress contracts', () => {
      const count = service.calculateInProgressCount();
      expect(count).toBe(1);
    });
  });

  describe('calculateAvgRiskScore', () => {
    it('should return average risk score across all contracts', () => {
      const avg = service.calculateAvgRiskScore();
      expect(avg).toBe(44);
    });
  });

  describe('calculateCriticalFlagCount', () => {
    it('should return total critical flag count', () => {
      const count = service.calculateCriticalFlagCount();
      expect(count).toBe(9);
    });
  });

  describe('calculateUrgentRenewalCount', () => {
    it('should return count of renewals with less than 60 days remaining', () => {
      const count = service.calculateUrgentRenewalCount();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getRecentContracts', () => {
    it('should return at most 4 contracts sorted by uploadedAt descending', () => {
      const contracts = service.getRecentContracts();
      expect(contracts.length).toBeLessThanOrEqual(4);
      for (let i = 0; i < contracts.length - 1; i++) {
        expect(contracts[i].uploadedAt.getTime()).toBeGreaterThanOrEqual(
          contracts[i + 1].uploadedAt.getTime(),
        );
      }
    });
  });

  describe('getUrgentRenewals', () => {
    it('should return at most 3 renewals sorted by daysRemaining ascending', () => {
      const renewals = service.getUrgentRenewals();
      expect(renewals.length).toBeLessThanOrEqual(3);
      for (let i = 0; i < renewals.length - 1; i++) {
        expect(renewals[i].daysRemaining).toBeLessThanOrEqual(renewals[i + 1].daysRemaining);
      }
    });

    it('should assign correct urgency levels', () => {
      const renewals = service.getUrgentRenewals();
      renewals.forEach((r) => {
        if (r.daysRemaining < 30) {
          expect(r.urgency).toBe('critical');
        } else if (r.daysRemaining < 60) {
          expect(r.urgency).toBe('high');
        } else {
          expect(r.urgency).toBe('medium');
        }
      });
    });
  });
});
