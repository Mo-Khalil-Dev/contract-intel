export class ValidateSessionQuery {
  constructor(readonly sessionId: string) {}
}

export type SessionStatus = 'valid' | 'expired' | 'not_found';

export interface ValidateSessionResult {
  status: SessionStatus;
  userId?: string;
  expiresAt?: Date;
}
