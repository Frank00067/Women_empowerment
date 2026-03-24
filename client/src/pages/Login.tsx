import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    const dest =
      from ??
      (user.role === "admin" ? "/admin" : user.role === "employer" ? "/employer" : "/learner");
    return <Navigate to={dest} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container section">
      <div className="form-card">
        <h1>Welcome back</h1>
        <p className="muted" style={{ marginTop: "-0.5rem" }}>
          Log in to continue courses, applications, and your dashboard.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>
        <p className="muted small" style={{ marginTop: "1rem", marginBottom: 0 }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
        <p className="muted small" style={{ marginTop: "0.5rem" }}>
          After <code>npm run seed</code> in <code>server/</code>: admin{" "}
          <code>admin@demo.com</code> / <code>password123</code>
        </p>
      </div>
    </div>
  );
}
