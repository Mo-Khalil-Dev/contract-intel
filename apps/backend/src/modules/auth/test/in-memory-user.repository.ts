import { IUserRepository } from '../domain/user.repository';
import { User } from '../domain/user.aggregate';
import { UserId } from '../domain/value-objects/user-id.vo';
import { Email } from '../domain/value-objects/email.vo';
import { Auth0SubjectId } from '../domain/value-objects/auth0-subject-id.vo';

export class InMemoryUserRepository implements IUserRepository {
  private store = new Map<string, User>();

  async findById(id: UserId): Promise<User | null> {
    return this.store.get(id.value) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email.equals(email)) return user;
    }
    return null;
  }

  async findByAuth0SubjectId(subjectId: Auth0SubjectId): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.auth0SubjectId.equals(subjectId)) return user;
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.store.set(user.id.value, user);
  }

  size(): number {
    return this.store.size;
  }
}
