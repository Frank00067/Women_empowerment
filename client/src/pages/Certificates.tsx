import { useEffect, useState } from "react";
import { api } from "../api";
import type { CertificateItem } from "../types";

export function Certificates() {
  const [list, setList] = useState<CertificateItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<CertificateItem[]>("/certificates/mine")
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  if (error) {
    return (
      <div className="container section">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container section">
      <p className="eyebrow">Achievements</p>
      <h1 className="page-title">Your certificates</h1>
      <p className="page-intro">
        Certificates are issued automatically when you complete every lesson in a course.
      </p>
      {list.length === 0 && <p className="muted">No certificates yet — finish a full course to earn one.</p>}
      <div className="card-grid">
        {list.map((c) => (
          <article key={c.id} className="course-card">
            <span className="badge">Certificate</span>
            <h2 style={{ margin: "0.25rem 0", fontSize: "1.15rem" }}>
              {c.courseTitle ?? "Course complete"}
            </h2>
            <p className="muted small" style={{ margin: 0 }}>
              Issued {new Date(c.issuedAt).toLocaleDateString()}
            </p>
            <p className="muted" style={{ flex: 1, margin: 0 }}>
              Great work — this milestone is saved to your learner record.
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
