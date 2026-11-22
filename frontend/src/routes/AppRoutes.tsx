import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/common/Spinner';
import { AppLayout } from '../components/layout/AppLayout';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { VoiceProfile } from '../pages/VoiceProfile';
import { CallRoom } from '../pages/CallRoom';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-bg text-ink-muted">
        <Spinner size="lg" label="Checking authentication..." />
      </div>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          <AppLayout showAiDisclosure={false}>
            <Login />
          </AppLayout>
        }
      />
      <Route
        path="/register"
        element={
          <AppLayout showAiDisclosure={false}>
            <Register />
          </AppLayout>
        }
      />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/voice"
        element={
          <ProtectedRoute>
            <AppLayout>
              <VoiceProfile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/call/:roomId"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CallRoom />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
