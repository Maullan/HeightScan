import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Guards a route behind Supabase authentication.
 *
 * - While auth state is being determined (isLoading): show a full-screen spinner.
 *   This prevents a flash-redirect to /login on page refresh before the session
 *   is restored from localStorage.
 * - If not authenticated: redirect to /login (saves intended path in location state).
 * - If authenticated: render children.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-brand-400 animate-spin" />
          <p className="text-white/40 text-sm font-mono">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the page they tried to visit so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
