export interface CurrentUserResponseDto {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  lastLoginAt: string | null;
}
