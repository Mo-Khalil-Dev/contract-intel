import type { AuditEvent as PrismaAuditEvent, Prisma } from '@prisma/client';
import { AuditEvent } from '../domain/audit-event.aggregate';
import { AuditEventId } from '../domain/audit-event-id.vo';
import { AuditAction } from '../domain/audit-action.vo';
import { ActorId } from '../domain/actor-id.vo';
import { ResourceId } from '../domain/resource-id.vo';
import { Checksum } from '../domain/checksum.vo';
import { SequenceNumber } from '../domain/sequence-number.vo';
import { AuditEventResponseDto } from './dtos/audit-event.response.dto';

/**
 * Translates between the AuditEvent aggregate (domain), Prisma row
 * (persistence), and AuditEventResponseDto (API).
 *
 * The domain model stores resourceId as a combined "resourceType:resourceId"
 * string (see RecordAuditEventHandler). The Prisma model stores them in
 * separate columns. The mapper splits/joins as needed.
 */
export class AuditEventMapper {
  /**
   * Rehydrate an AuditEvent aggregate from a Prisma row.
   * Does NOT emit domain events (rehydration path).
   */
  static toDomain(row: PrismaAuditEvent): AuditEvent {
    // Reconstruct the combined resourceId used by the domain model
    const combinedResourceId = `${row.resourceType}:${row.resourceId}`;

    return AuditEvent.rehydrate(AuditEventId.fromString(row.id), {
      actorId: ActorId.fromString(row.actorId),
      action: AuditAction.fromString(row.action),
      resourceId: ResourceId.fromString(combinedResourceId),
      checksum: Checksum.fromString(row.checksum),
      sequenceNumber: SequenceNumber.fromNumber(row.sequenceNumber),
      timestamp: row.timestamp,
    });
  }

  /**
   * Map an AuditEvent aggregate to a Prisma create input.
   * Splits the combined "resourceType:resourceId" domain value into
   * separate columns.
   */
  static toPersistence(event: AuditEvent): Prisma.AuditEventCreateInput {
    const [resourceType, ...rest] = event.resourceId.value.split(':');
    const resourceId = rest.join(':'); // handles IDs that contain ':'

    return {
      id: event.id.value,
      actorId: event.actorId.value,
      action: event.action.value,
      resourceType: resourceType ?? event.resourceId.value,
      resourceId: resourceId || event.resourceId.value,
      checksum: event.checksum.value,
      sequenceNumber: event.sequenceNumber.value,
      timestamp: event.timestamp,
      metadata: undefined,
    };
  }

  /**
   * Map an AuditEvent aggregate to a response DTO.
   */
  static toDto(event: AuditEvent): AuditEventResponseDto {
    const [resourceType, ...rest] = event.resourceId.value.split(':');
    const resourceId = rest.join(':') || event.resourceId.value;

    const dto = new AuditEventResponseDto();
    dto.id = event.id.value;
    dto.actorId = event.actorId.value;
    dto.action = event.action.value;
    dto.resourceType = resourceType ?? event.resourceId.value;
    dto.resourceId = resourceId;
    dto.checksum = event.checksum.value;
    dto.sequenceNumber = event.sequenceNumber.value;
    dto.timestamp = event.timestamp.toISOString();
    dto.metadata = null;
    return dto;
  }
}
