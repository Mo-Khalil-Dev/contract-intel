import {
  Controller,
  Get,
  Query,
  Res,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, RequestUser } from '../../auth/infrastructure/decorators/current-user.decorator';
import { QueryAuditEventsQuery } from '../application/queries/query-audit-events.query';
import { ExportAuditLogQuery, ExportAuditLogResult } from '../application/queries/export-audit-log.query';
import { QueryAuditEventsDto } from './dtos/query-audit-events.dto';
import { ExportAuditLogDto } from './dtos/export-audit-log.dto';
import { PaginatedAuditEventsResponseDto } from './dtos/audit-event.response.dto';

/**
 * Audit log endpoints — admin-only.
 *
 * Both endpoints are protected by the global SessionAuthGuard.
 * An additional role check enforces that only ADMIN users can access
 * the audit log.
 */
@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly queryBus: QueryBus) {}

  /**
   * GET /api/v1/audit
   * Query audit events with optional filters and pagination.
   * Admin-only.
   */
  @Get()
  @ApiOperation({ summary: 'Query audit events (admin only)' })
  @ApiOkResponse({ type: PaginatedAuditEventsResponseDto })
  async queryAuditEvents(
    @CurrentUser() user: RequestUser,
    @Query() dto: QueryAuditEventsDto,
  ): Promise<PaginatedAuditEventsResponseDto> {
    this.requireAdmin(user);

    const result = await this.queryBus.execute(
      new QueryAuditEventsQuery(
        dto.actorId,
        dto.action,
        dto.resourceId,
        dto.fromDate ? new Date(dto.fromDate) : undefined,
        dto.toDate ? new Date(dto.toDate) : undefined,
        dto.page,
        dto.pageSize,
      ),
    );

    return result;
  }

  /**
   * GET /api/v1/audit/export
   * Export the audit log as JSON or CSV file download.
   * Admin-only.
   */
  @Get('export')
  @ApiOperation({ summary: 'Export audit log as file download (admin only)' })
  async exportAuditLog(
    @CurrentUser() user: RequestUser,
    @Query() dto: ExportAuditLogDto,
    @Res() res: Response,
  ): Promise<void> {
    this.requireAdmin(user);

    const result: ExportAuditLogResult = await this.queryBus.execute(
      new ExportAuditLogQuery(
        dto.format,
        dto.actorId,
        dto.action,
        dto.resourceId,
        dto.fromDate ? new Date(dto.fromDate) : undefined,
        dto.toDate ? new Date(dto.toDate) : undefined,
      ),
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private requireAdmin(user: RequestUser): void {
    if (user.role !== 'ADMIN') {
      this.logger.warn(`Non-admin user ${user.userId} attempted to access audit log`);
      throw new ForbiddenException('Only administrators can access the audit log');
    }
  }
}
