import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { ReferenceDataController } from './infrastructure/reference-data.controller';
import { GetReferenceDataHandler } from './application/queries/get-reference-data.handler';
import { DashboardMetricsService } from './application/services/dashboard-metrics.service';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [ReferenceDataController],
  providers: [GetReferenceDataHandler, DashboardMetricsService],
})
export class ReferenceDataModule {}
