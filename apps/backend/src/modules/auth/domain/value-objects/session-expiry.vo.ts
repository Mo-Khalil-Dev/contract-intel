import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface SessionExpiryProps {
  expiresAt: Date;
}

export class SessionExpiry extends ValueObject<SessionExpiryProps> {
  private constructor(expiresAt: Date) {
    super({ expiresAt });
  }

  static fromDate(expiresAt: Date, now: Date = new Date()): SessionExpiry {
    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
      throw new DomainException('INVALID_SESSION_EXPIRY', 'Session expiry must be a valid Date');
    }
    if (expiresAt.getTime() <= now.getTime()) {
      throw new DomainException(
        'INVALID_SESSION_EXPIRY',
        `Session expiry must be in the future (got ${expiresAt.toISOString()}, now ${now.toISOString()})`,
      );
    }
    return new SessionExpiry(expiresAt);
  }

  static fromTtlSeconds(ttlSeconds: number, now: Date = new Date()): SessionExpiry {
    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      throw new DomainException(
        'INVALID_SESSION_EXPIRY',
        `Session TTL must be a positive number of seconds (got ${ttlSeconds})`,
      );
    }
    return SessionExpiry.fromDate(new Date(now.getTime() + ttlSeconds * 1000), now);
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  secondsUntilExpiry(now: Date = new Date()): number {
    return Math.max(0, Math.floor((this.props.expiresAt.getTime() - now.getTime()) / 1000));
  }
}
