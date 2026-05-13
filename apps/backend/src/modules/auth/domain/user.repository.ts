import { User } from './user.aggregate';
import { UserId } from './value-objects/user-id.vo';
import { Email } from './value-objects/email.vo';
import { Auth0SubjectId } from './value-objects/auth0-subject-id.vo';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByAuth0SubjectId(subjectId: Auth0SubjectId): Promise<User | null>;
  save(user: User): Promise<void>;
}
