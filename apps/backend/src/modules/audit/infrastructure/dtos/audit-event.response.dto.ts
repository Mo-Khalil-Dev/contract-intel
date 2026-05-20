import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditActionEnum } from '../../domain/audit-action.vo';

export class AuditEventResponseDto {
  @ApiProperty({ description: 'Unique audit event ID (UUID)' })
  id!: string;

  @ApiProperty({ description: 'ID of the actor who triggered the event' })
  actorId!: string;

  @ApiProperty({ enum: AuditActionEnum, description: 'The action that was performed' })
  action!: AuditActionEnum;

  @ApiProperty({ description: 'Type of the resource affected (e.g. "document", "user")' })
  resourceType!: string;

  @ApiProperty({ description: 'ID of the resource affected' })
  resourceId!: string;

  @ApiProperty({ description: 'SHA-256 checksum for tamper detection' })
  checksum!: string;

  @ApiProperty({ description: 'Monotonically increasing sequence number' })
  sequenceNumber!: number;

  @ApiProperty({ description: 'When the event occurred (ISO 8601)' })
  timestamp!: string;

  @ApiPropertyOptional({ description: 'Additional context for the event (JSON)' })
  metadata?: Record<string, unknown> | null;
}

export class PaginatedAuditEventsResponseDto {
  @ApiProperty({ type: [AuditEventResponseDto] })
  events!: AuditEventResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  totalPages!: number;
}
