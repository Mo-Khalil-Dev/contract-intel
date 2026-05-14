import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/features/ProtectedRoute/ProtectedRoute';
import { LoginCallbackPage } from '@/pages/LoginCallbackPage';
import { HomePageContainer } from '@/pages/HomePage/HomePageContainer';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
