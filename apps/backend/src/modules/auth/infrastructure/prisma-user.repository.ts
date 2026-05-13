import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { IUserRepository } from '../domain/user.repository';
import { User } from '../domain/user.aggregate';
import { UserId } from '../domain/value-objects/user-id.vo';
import { Email } from '../domain/value-objects/email.vo';
import { Auth0SubjectId } from '../domain/value-objects/auth0-subject-id.vo';
import { UserMapper } from './user.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UserId): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id: id.value } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.value } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByAuth0SubjectId(subjectId: Auth0SubjectId): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { auth0SubjectId: subjectId.value },
    });
    return row ? UserMapper.toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.user.upsert({
      where: { id: data.id },
      update: {
        email: data.email,
        auth0SubjectId: data.auth0SubjectId,
        displayName: data.displayName,
        role: data.role,
        lastLoginAt: data.lastLoginAt,
        updatedAt: data.updatedAt,
      },
      create: data,
    });
  }
}
