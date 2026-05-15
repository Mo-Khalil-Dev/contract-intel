/// <reference types="vite/client" />

// Project-specific env vars exposed to the browser via Vite's import.meta.env.
// All build-time keys must be prefixed with VITE_ and listed here for type safety.
interface ImportMetaEnv {
  /** Backend API origin (no trailing /api/v1). Falls back to http://localhost:3000 in dev. */
  readonly VITE_API_URL?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
