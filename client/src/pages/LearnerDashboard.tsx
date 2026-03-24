import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

interface LearnerDash {
  courseSummaries: { courseId: string; title: string; done: number; total: number; percent: number }[];
  certificatesCount: number;
  applicationsCount: number;
  unreadNotifications: number;
}

export function LearnerDashboard() {
  const [data, setData] = useState<LearnerDash | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<LearnerDash>("/dashboard/learner")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  if (error) {
    return (
      <div className="container section">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container section">
      <p className="eyebrow">Overview</p>
      <h1 className="page-title">Learner dashboard</h1>
      <p className="page-intro">Track courses, applications, and certificates in one place.</p>
      <div className="dashboard-grid">
        <div className="dash-stat">
          <strong>{data.certificatesCount}</strong>
          <span className="muted">Certificates earned</span>
        </div>
        <div className="dash-stat">
          <strong>{data.applicationsCount}</strong>
          <span className="muted">Job applications</span>
        </div>
        <div className="dash-stat">
          <strong>{data.unreadNotifications}</strong>
          <span className="muted">Unread alerts</span>
        </div>
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>Course progress</h2>
      <ul className="lesson-list">
        {data.courseSummaries.map((c) => (
          <li key={c.courseId} className="lesson-item">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <strong>{c.title}</strong>
                <p className="muted small" style={{ margin: 0 }}>
                  {c.done} / {c.total} lessons · {c.percent}%
                </p>
              </div>
              <Link to={`/courses/${c.courseId}`} className="btn btn-outline">
                Continue
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: "1.5rem" }}>
        <Link to="/jobs" className="btn btn-primary">
          Browse jobs
        </Link>{" "}
        <Link to="/cv" className="btn btn-secondary">
          CV builder
        </Link>
      </p>
    </div>
  );
}
