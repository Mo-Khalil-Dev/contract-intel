export const API = {
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_CALLBACK: '/api/v1/auth/callback',
  AUTH_LOGOUT: '/api/v1/auth/logout',
  AUTH_ME: '/api/v1/auth/me',
  REFERENCE_DATA: '/api/v1/reference-data',

  // ── Documents (uploads) ────────────────────────────────────────
  INITIATE_UPLOAD: '/api/v1/documents/upload/initiate',
  COMPLETE_UPLOAD: '/api/v1/documents/upload/complete',
  UPLOAD_STATUS: (id: string) => `/api/v1/documents/${id}/status`,
};
