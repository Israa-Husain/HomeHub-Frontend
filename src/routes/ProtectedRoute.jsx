import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Notice } from '../components/Common';
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p role="status">Restoring your session…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace/>;
  if (roles && !roles.includes(user.role)) return <Notice kind="error">You don't have permission to view this page.</Notice>;
  return <Outlet/>;
}
