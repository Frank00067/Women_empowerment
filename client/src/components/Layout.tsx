import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <header className="site-header">
        <Link to="/" className="logo">
          <span className="logo-mark" aria-hidden />
          Rise Digital
        </Link>
        <nav className="nav-main" aria-label="Main">
          <NavLink to="/courses" className={({ isActive }) => (isActive ? "active" : "")}>
            Courses
          </NavLink>
          <NavLink to="/jobs" className={({ isActive }) => (isActive ? "active" : "")}>
            Jobs
          </NavLink>
          <NavLink to="/mentorship" className={({ isActive }) => (isActive ? "active" : "")}>
            Mentorship
          </NavLink>
          <NavLink to="/workshops" className={({ isActive }) => (isActive ? "active" : "")}>
            Workshops
          </NavLink>
          {user?.role === "learner" && (
            <>
              <NavLink to="/cv" className={({ isActive }) => (isActive ? "active" : "")}>
                CV Builder
              </NavLink>
              <NavLink to="/certificates" className={({ isActive }) => (isActive ? "active" : "")}>
                Certificates
              </NavLink>
            </>
          )}
        </nav>
        <div className="nav-actions">
          {user && (
            <NavLink to="/notifications" className="notif-link">
              Alerts
            </NavLink>
          )}
          {user ? (
            <>
              <NavLink
                to={
                  user.role === "admin"
                    ? "/admin"
                    : user.role === "employer"
                      ? "/employer"
                      : "/learner"
                }
                className="btn btn-ghost"
              >
                Dashboard
              </NavLink>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  void (async () => {
                    await logout();
                    navigate("/");
                  })();
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <p>
          Empowering young African women with digital skills, career tools, and mentorship.
        </p>
        <p className="muted small">© {new Date().getFullYear()} Rise Digital · Demo platform</p>
      </footer>
    </div>
  );
}
