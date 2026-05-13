export class LoginCommand {
  constructor(
    readonly authorizationCode: string,
    readonly redirectUri: string,
    readonly context: {
      ipAddress?: string;
      userAgent?: string;
    } = {},
  ) {}
}

export interface LoginResult {
  sessionId: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  expiresAt: Date;
}
