import { User as PrismaUser } from '@prisma/client';
import { User } from '../domain/user.aggregate';
import { UserId } from '../domain/value-objects/user-id.vo';
import { Email } from '../domain/value-objects/email.vo';
import { Auth0SubjectId } from '../domain/value-objects/auth0-subject-id.vo';
import { UserRole } from '../domain/value-objects/user-role.vo';

// Maps between the User aggregate, the Prisma row, and the response DTO.
// Keeps Prisma types out of the domain layer entirely.
export const UserMapper = {
  toDomain(row: PrismaUser): User {
    return User.rehydrate(UserId.fromString(row.id), {
      email: Email.create(row.email),
      auth0SubjectId: Auth0SubjectId.fromString(row.auth0SubjectId),
      displayName: row.displayName,
      role: UserRole.fromString(row.role),
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toPersistence(user: User): Omit<PrismaUser, 'createdAt' | 'updatedAt'> & {
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: user.id.value,
      email: user.email.value,
      auth0SubjectId: user.auth0SubjectId.value,
      displayName: user.displayName,
      role: user.role.value,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
};
