import { ISessionRepository } from '../domain/session.repository';
import { Session } from '../domain/session.aggregate';
import { SessionId } from '../domain/value-objects/session-id.vo';
import { UserId } from '../domain/value-objects/user-id.vo';

export class InMemorySessionRepository implements ISessionRepository {
  private store = new Map<string, Session>();

  async findById(id: SessionId): Promise<Session | null> {
    return this.store.get(id.value) ?? null;
  }

  async findByUserId(userId: UserId): Promise<Session[]> {
    return Array.from(this.store.values()).filter((s) => s.belongsTo(userId));
  }

  async save(session: Session): Promise<void> {
    this.store.set(session.id.value, session);
  }

  async delete(id: SessionId): Promise<void> {
    this.store.delete(id.value);
  }

  async deleteByUserId(userId: UserId): Promise<void> {
    for (const [id, session] of this.store.entries()) {
      if (session.belongsTo(userId)) this.store.delete(id);
    }
  }

  size(): number {
    return this.store.size;
  }
}
