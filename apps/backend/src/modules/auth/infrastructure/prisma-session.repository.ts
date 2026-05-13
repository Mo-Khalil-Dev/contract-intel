import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { ISessionRepository } from '../domain/session.repository';
import { Session } from '../domain/session.aggregate';
import { SessionId } from '../domain/value-objects/session-id.vo';
import { UserId } from '../domain/value-objects/user-id.vo';
import { SessionMapper } from './session.mapper';

@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: SessionId): Promise<Session | null> {
    const row = await this.prisma.session.findUnique({ where: { id: id.value } });
    return row ? SessionMapper.toDomain(row) : null;
  }

  async findByUserId(userId: UserId): Promise<Session[]> {
    const rows = await this.prisma.session.findMany({ where: { userId: userId.value } });
    return rows.map((row) => SessionMapper.toDomain(row));
  }

  async save(session: Session): Promise<void> {
    const data = SessionMapper.toPersistence(session);
    await this.prisma.session.upsert({
      where: { id: data.id },
      update: {
        encryptedAccessToken: data.encryptedAccessToken,
        encryptedRefreshToken: data.encryptedRefreshToken,
        encryptionSalt: data.encryptionSalt,
        keyName: data.keyName,
        expiresAt: data.expiresAt,
        updatedAt: data.updatedAt,
      },
      create: data,
    });
  }

  async delete(id: SessionId): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id: id.value } });
  }

  async deleteByUserId(userId: UserId): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId: userId.value } });
  }
}
