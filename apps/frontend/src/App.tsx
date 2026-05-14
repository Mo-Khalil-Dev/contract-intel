import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/features/ProtectedRoute/ProtectedRoute';
import { LoginCallbackPage } from '@/pages/LoginCallbackPage';
import { HomePageContainer } from '@/pages/HomePage/HomePageContainer';
import { HomePageV2Container } from '@/pages/HomePageV2';

function App() {
  return (
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
