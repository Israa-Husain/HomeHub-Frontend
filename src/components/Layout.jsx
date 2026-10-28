import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  House,
  Menu,
  X,
  CalendarDays,
  Bell,
  UserRound,
  Wrench,
  Heart,
  ListChecks,
  Settings,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
const common = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/services", "Browse services", Wrench],
  ["/bookings", "Bookings", CalendarDays],
  ["/reviews", "Reviews", ListChecks],
];
const roleLinks = {
  HOMEOWNER: [
    ["/homes", "My homes", House],
    ["/favorites", "Favorites", Heart],
    ["/waitlist", "Waitlist", ListChecks],
    ["/reschedules", "Reschedule requests", CalendarDays],
  ],
  PROVIDER: [
    ["/provider/profile", "Business profile", UserRound],
    ["/provider/services", "Manage services", Wrench],
    ["/provider/availability", "Availability", CalendarDays],
    ["/provider/reschedules", "Reschedule decisions", ListChecks],
  ],
  ADMIN: [
    ["/admin/users", "Users", UserRound],
    ["/admin/providers", "Provider applications", ListChecks],
    ["/admin/categories", "Categories", Settings],
  ],
};
export default function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useNotifications();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        {user && <button className="mobile-menu" aria-expanded={menuOpen} aria-controls="workspace-nav" aria-label={menuOpen ? "Close workspace navigation" : "Open workspace navigation"} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}<span>Menu</span>
        </button>}
        <Link to="/" className="brand">
          <House size={24} />
          HomeHub
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/services">Services</Link>
          {user ? (
            <>
              <Link
                to="/notifications"
                aria-label={`Notifications, ${count} unread`}
              >
                <Bell size={18} />
                <span>{count}</span>
              </Link>
              <Link to="/account">{user.firstName}</Link>
              <button className="quiet" onClick={logout}>
                <LogOut size={16} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link className="button primary" to="/register">
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>
      <div className={user ? "app-shell" : "public-shell"}>
        {user && (
          <aside className={`sidebar ${menuOpen ? "is-open" : ""}`} id="workspace-nav">
            <p className="role">{user.role.toLowerCase()} workspace</p>
            <nav aria-label="Workspace navigation">
              {[
                ...(user.role === "ADMIN" ? [common[0], ...roleLinks.ADMIN, ...common.slice(1)] : [...common, ...(roleLinks[user.role] || [])]),
                ["/notifications", "Notifications", Bell],
                ["/account", "Account", UserRound],
              ].map(([to, name, Icon]) => (
                <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
                  <Icon size={17} />
                  {name}
                </NavLink>
              ))}
            </nav>
          </aside>
        )}
        <main id="main">
          {user && (
            <p className="timezone-note">
              Appointments and deadlines use Bahrain time (UTC+3).
            </p>
          )}
          <Outlet />
        </main>
      </div>
      <footer>HomeHub · Home services across Bahrain.</footer>
    </>
  );
}
