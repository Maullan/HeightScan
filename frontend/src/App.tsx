import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { WebSocketProvider } from './context/WebSocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MeasurementPage from './pages/MeasurementPage';
import ResultPage from './pages/ResultPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — require Supabase login */}
      <Route
        path="/measure"
        element={
          <ProtectedRoute>
            <MeasurementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/result"
        element={
          <ProtectedRoute>
            <ResultPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider wraps everything — auth state must be available to all routes */}
      <AuthProvider>
        <SessionProvider>
          <WebSocketProvider>
            <AppRoutes />
          </WebSocketProvider>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
