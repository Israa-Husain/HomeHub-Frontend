import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loading, Notice } from "../components/Common";
export default function ProtectedRoute({ roles }) {
  const { user, loading, restoreError, retrySession, logout } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Restoring your session…" />;
  if (restoreError) return <section className="card"><h1>Unable to restore your session</h1><Notice kind="error">{restoreError}</Notice><div className="inline-links"><button className="primary" onClick={retrySession}>Try again</button><button onClick={logout}>Sign out</button></div></section>;
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (roles && !roles.includes(user.role))
    return (
      <section className="card"><h1>Access restricted</h1><Notice kind="error">Your account does not have permission to view this page.</Notice><Link className="button primary" to="/dashboard">Return to your dashboard</Link></section>
    );
  return <Outlet />;
}
