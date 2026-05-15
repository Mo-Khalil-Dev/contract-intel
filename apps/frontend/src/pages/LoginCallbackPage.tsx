import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { API } from '@/api/endpoints';
import { track } from '@/analytics';

export function LoginCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (!code || !state) {
        track('auth_login_failed', { reason: 'missing_code_or_state' });
        setError('Missing code or state from Auth0');
        return;
      }

      try {
        // Use apiClient so the request goes to the absolute backend origin
        // (VITE_API_URL) with credentials. A raw fetch() against API.AUTH_CALLBACK
        // is a relative URL and resolves against the frontend host, which on
        // Railway returns the SPA's index.html — causing JSON.parse to choke
        // on `<`.
        const { data } = await apiClient.post(API.AUTH_CALLBACK, { code, state });

        track('auth_login_succeeded');
        const returnUrl = data?.data?.returnUrl || '/';
        window.location.href = returnUrl;
      } catch (err) {
        track('auth_login_failed', {
          reason: err instanceof Error ? err.message : 'network_error',
        });
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [location.search]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="mt-2 text-ink-soft">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="mt-4 text-ink-soft">Completing authentication...</p>
      </div>
    </div>
  );
}
