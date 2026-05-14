import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/core/ErrorBoundary';
import { ProtectedRoute } from '@/components/features/ProtectedRoute/ProtectedRoute';
import { LoginCallbackPage } from '@/pages/LoginCallbackPage';
import { HomePageContainer } from '@/pages/HomePage/HomePageContainer';
import { HomePageV2Container } from '@/pages/HomePageV2';
import { UploadPageContainer } from '@/pages/UploadPage';
import { ProcessingPage } from '@/pages/ProcessingPage/ProcessingPage';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/auth/callback" element={<LoginCallbackPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePageContainer />
                </ProtectedRoute>
              }
            />
            {/* Experimental dashboard built with fully-custom components.
                Compare against `/` to evaluate the no-Shadcn approach. */}
            <Route
              path="/v2"
              element={
                <ProtectedRoute>
                  <HomePageV2Container />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPageContainer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/processing/:documentId"
              element={
                <ProtectedRoute>
                  <ProcessingPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>

        {/* Global toast container — must be outside BrowserRouter so it survives route changes */}
        <Toaster position="bottom-right" richColors closeButton />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
