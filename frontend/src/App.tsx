import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { Toast } from '@/components/feedback/Toast';

// Pages
import { LoginPage } from '@/pages/Login/LoginPage';
import { RegisterPage } from '@/pages/Register/RegisterPage';
import { LandingPage } from '@/pages/Landing/LandingPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { ProblemFeedPage } from '@/pages/ProblemFeed/ProblemFeedPage';
import { CreateProblemPage } from '@/pages/ProblemFeed/CreateProblemPage';
import { ProblemDetailPage } from '@/pages/ProblemDetail/ProblemDetailPage';
import { IdeaLabPage } from '@/pages/IdeaLab/IdeaLabPage';
import { RoomDetailPage } from '@/pages/RoomDetail/RoomDetailPage';
import { IdeaDetailPage } from '@/pages/IdeaDetail/IdeaDetailPage';
import { CreateIdeaPage } from '@/pages/RoomDetail/CreateIdeaPage';

function App() {
  const { fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <AuthGuard>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/admin" element={<DashboardPage />} />
                  <Route path="/problems" element={<ProblemFeedPage />} />
                  <Route path="/problems/new" element={<CreateProblemPage />} />
                  <Route path="/problems/:id" element={<ProblemDetailPage />} />
                  <Route path="/rooms" element={<IdeaLabPage />} />
                  <Route path="/rooms/:id" element={<RoomDetailPage />} />
                  <Route path="/rooms/:roomId/ideas/new" element={<CreateIdeaPage />} />
                  <Route path="/ideas/:id" element={<IdeaDetailPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            </AuthGuard>
          }
        />
      </Routes>
      <Toast />
    </>
  );
}

export default App;
