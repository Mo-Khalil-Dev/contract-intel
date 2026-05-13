export class GetCurrentUserQuery {
  constructor(readonly userId: string) {}
}

export interface CurrentUserView {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  lastLoginAt: Date | null;
}
