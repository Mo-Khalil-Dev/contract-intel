import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import {
  CurrentUser,
  RequestUser,
} from '../../auth/infrastructure/decorators/current-user.decorator';
import { GetReferenceDataQuery } from '../application/queries/get-reference-data.query';
import { ReferenceDataResponseDto } from './dtos/reference-data.response.dto';
import { ReferenceDataViewModel } from '../application/queries/get-reference-data.handler';

@ApiTags('Reference Data')
@Controller('reference-data')
export class ReferenceDataController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOkResponse({ type: ReferenceDataResponseDto })
  async getReferenceData(@CurrentUser() user: RequestUser): Promise<ReferenceDataResponseDto> {
    const viewModel = await this.queryBus.execute<GetReferenceDataQuery, ReferenceDataViewModel>(
      new GetReferenceDataQuery(user.userId, 'org-default'),
    );

    return {
      data: {
        user: viewModel.user,
        kpis: viewModel.kpis,
        recentContracts: viewModel.recentContracts,
        urgentRenewals: viewModel.urgentRenewals,
        lastOpenedContract: viewModel.lastOpenedContract,
      },
      actions: {
        canUploadDocument: true,
        canViewContracts: true,
        canViewRenewals: true,
      },
      ui: {
        orgBannerText: 'Legal Operations · Contract Review Workspace',
        systemStatus: 'All systems operational',
        systemStatusColor: 'success',
      },
    };
  }
}
