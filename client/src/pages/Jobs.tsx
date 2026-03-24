import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { JobItem } from "../types";

export function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyJob, setApplyJob] = useState<JobItem | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api<JobItem[]>("/jobs")
      .then(setJobs)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }

  useEffect(() => {
    load();
  }, []);

  async function submitApplication(e: FormEvent) {
    e.preventDefault();
    if (!applyJob) return;
    setBusy(true);
    setError(null);
    try {
      await api("/applications", {
        method: "POST",
        body: JSON.stringify({ jobId: applyJob.id, coverLetter }),
      });
      setApplyJob(null);
      setCoverLetter("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apply failed");
    } finally {
      setBusy(false);
    }
  }

  if (!jobs) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container section">
      <p className="eyebrow">Careers</p>
      <h1 className="page-title">Jobs board</h1>
      <p className="page-intro">
        Roles shared by employer partners. Learners can apply with a short cover note; employers
        manage applications from their dashboard.
      </p>
      {error && <div className="error-banner">{error}</div>}
      <div className="card-grid">
        {jobs.length === 0 && <p className="muted">No jobs yet. Check back soon.</p>}
        {jobs.map((j) => (
          <article key={j.id} className="job-card">
            <span className="badge">{j.employerName ?? "Employer"}</span>
            <h2 style={{ margin: "0.25rem 0", fontSize: "1.2rem" }}>{j.title}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {j.description}
            </p>
            {(j.location || j.salary) && (
              <p className="muted small" style={{ margin: 0 }}>
                {[j.location, j.salary].filter(Boolean).join(" · ")}
              </p>
            )}
            {user?.role === "learner" && (
              <button type="button" className="btn btn-primary" onClick={() => setApplyJob(j)}>
                Apply
              </button>
            )}
            {!user && (
              <p className="muted small" style={{ marginBottom: 0 }}>
                <a href="/login">Log in</a> as a learner to apply.
              </p>
            )}
            {user && user.role !== "learner" && (
              <p className="muted small" style={{ marginBottom: 0 }}>
                Switch to a learner account to apply.
              </p>
            )}
          </article>
        ))}
      </div>

      {applyJob && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !busy && setApplyJob(null)}
        >
          <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Apply — {applyJob.title}</h2>
            <form onSubmit={submitApplication}>
              <div className="field">
                <label htmlFor="cover">Cover note</label>
                <textarea
                  id="cover"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Why are you a great fit?"
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busy}
                  onClick={() => setApplyJob(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? "Sending…" : "Submit application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
