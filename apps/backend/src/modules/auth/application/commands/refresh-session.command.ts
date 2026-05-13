export class RefreshSessionCommand {
  constructor(readonly sessionId: string) {}
}

export interface RefreshSessionResult {
  sessionId: string;
  expiresAt: Date;
}
