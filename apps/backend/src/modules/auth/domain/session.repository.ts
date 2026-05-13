import { Session } from './session.aggregate';
import { SessionId } from './value-objects/session-id.vo';
import { UserId } from './value-objects/user-id.vo';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export interface ISessionRepository {
  findById(id: SessionId): Promise<Session | null>;
  findByUserId(userId: UserId): Promise<Session[]>;
  save(session: Session): Promise<void>;
  delete(id: SessionId): Promise<void>;
  deleteByUserId(userId: UserId): Promise<void>;
}
