import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidateSessionQuery, ValidateSessionResult } from './validate-session.query';
import { SESSION_REPOSITORY, ISessionRepository } from '../../domain/session.repository';
import { SessionId } from '../../domain/value-objects/session-id.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

@QueryHandler(ValidateSessionQuery)
export class ValidateSessionHandler implements IQueryHandler<
  ValidateSessionQuery,
  ValidateSessionResult
> {
  constructor(@Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository) {}

  async execute(query: ValidateSessionQuery): Promise<ValidateSessionResult> {
    // If the session id is malformed, treat it as not-found rather than
    // surfacing a 422 — callers (e.g. the auth guard) treat both the
    // same way.
    let sessionId: SessionId;
    try {
      sessionId = SessionId.fromString(query.sessionId);
    } catch (error) {
      if (error instanceof DomainException) {
        return { status: 'not_found' };
      }
      throw error;
    }

    const session = await this.sessions.findById(sessionId);
    if (!session) {
      return { status: 'not_found' };
    }

    if (session.isExpired()) {
      return {
        status: 'expired',
        userId: session.userId.value,
        expiresAt: session.expiry.expiresAt,
      };
    }

    return {
      status: 'valid',
      userId: session.userId.value,
      expiresAt: session.expiry.expiresAt,
    };
  }
}
