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

  // ── Documents (Phase 7 — OCR pipeline) ─────────────────────────
  PROCESSING_STATUS: (id: string) => `/api/v1/documents/${id}/processing-status`,
  RETRY_OCR: (id: string) => `/api/v1/documents/${id}/retry-ocr`,

  // ── Documents (Phase 8 — clause extraction) ────────────────────
  CLAUSES: (id: string) => `/api/v1/documents/${id}/clauses`,
  EXTRACTION_STATUS: (id: string) => `/api/v1/documents/${id}/extraction-status`,
  DOCUMENT_TEXT: (id: string) => `/api/v1/documents/${id}/text`,

  // ── Documents (Phase 10 — Contracts View) ──────────────────────
  DOCUMENTS: {
    LIST: '/api/v1/documents',
  },

  // ── Clause Intelligence (Phase 11) ─────────────────────────────
  SIMILAR_CLAUSES: (id: string) => `/api/v1/clauses/${id}/similar`,

  // ── Ask Your Portfolio (Phase 12) ──────────────────────────────
  ASK: '/api/v1/ask',

  // ── Audit (Phase 6) ─────────────────────────────────────────────
  AUDIT: {
    LIST: '/api/v1/audit',
    EXPORT: '/api/v1/audit/export',
  },
};
