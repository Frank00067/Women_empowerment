import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

export function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "admin">>("learner");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    const dest = user.role === "employer" ? "/employer" : "/learner";
    return <Navigate to={dest} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { needsEmailConfirmation } = await register({ name, email, password, role });
      if (needsEmailConfirmation) {
        setInfo(
          "Please confirm your email using the link Supabase sent you, then log in."
        );
      } else {
        navigate("/login", { state: { message: "Account created! Please log in." } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container section">
      <div className="form-card">
        <h1>Create your account</h1>
        <p className="muted" style={{ marginTop: "-0.5rem" }}>
          Choose <strong>learner</strong> for courses and jobs, or <strong>employer</strong> to post
          roles. Admin accounts are created via server seed only.
        </p>
        {error && <div className="error-banner">{error}</div>}
        {info && (
          <div className="error-banner" style={{ background: "#e4f2f0", color: "#0f4d4d" }}>
            {info}
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
          <div className="field">
            <span id="role-label" className="muted" style={{ fontWeight: 600 }}>
              Account type
            </span>
            <div className="role-toggle" role="group" aria-labelledby="role-label">
              <label>
                <input
                  type="radio"
                  name="role"
                  checked={role === "learner"}
                  onChange={() => setRole("learner")}
                />
                <span className="role-pill">Learner</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  checked={role === "employer"}
                  onChange={() => setRole("employer")}
                />
                <span className="role-pill">Employer</span>
              </label>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="muted small" style={{ marginTop: "1rem", marginBottom: 0 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
