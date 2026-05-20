import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditActionEnum } from '../../domain/audit-action.vo';

export class ExportAuditLogDto {
  @ApiProperty({ enum: ['json', 'csv'], description: 'Export format' })
  @IsEnum(['json', 'csv'])
  format: 'json' | 'csv';

  @ApiPropertyOptional({ description: 'Filter by actor (user) ID' })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({ enum: AuditActionEnum, description: 'Filter by action type' })
  @IsOptional()
  @IsEnum(AuditActionEnum)
  action?: AuditActionEnum;

  @ApiPropertyOptional({ description: 'Filter by resource ID' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Filter events from this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter events up to this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
