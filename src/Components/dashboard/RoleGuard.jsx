import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

/**
 * RoleGuard — allows access only to users whose role matches one of `allowedRoles`.
 * Admins always pass through.
 * Redirects to `fallback` if role doesn't match.
 */
export default function RoleGuard({ allowedRoles = [], fallback = '/' }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (!user.role) {
    return <Navigate to="/role-selection" replace />;
  }

  if (user.role === 'admin' || allowedRoles.includes(user.role)) {
    return <Outlet />;
  }

  return <Navigate to={fallback} replace />;
}
