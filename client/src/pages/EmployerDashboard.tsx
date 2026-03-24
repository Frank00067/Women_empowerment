import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import type { ApplicationItem, JobItem } from "../types";

interface EmployerDash {
  jobsPosted: number;
  totalApplications: number;
  pendingApplications: number;
  unreadNotifications: number;
}

export function EmployerDashboard() {
  const [stats, setStats] = useState<EmployerDash | null>(null);
  const [jobs, setJobs] = useState<JobItem[] | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", location: "", salary: "" });
  const [busy, setBusy] = useState(false);

  function loadStats() {
    api<EmployerDash>("/dashboard/employer").then(setStats).catch(() => {});
  }

  function loadJobs() {
    api<JobItem[]>("/jobs/mine").then(setJobs).catch(() => setJobs([]));
  }

  useEffect(() => {
    loadStats();
    loadJobs();
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setApplications(null);
      return;
    }
    api<ApplicationItem[]>(`/applications/for-job/${selectedJobId}`)
      .then(setApplications)
      .catch(() => setApplications([]));
  }, [selectedJobId]);

  async function postJob(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/jobs", { method: "POST", body: JSON.stringify(form) });
      setForm({ title: "", description: "", location: "", salary: "" });
      loadJobs();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(appId: string, status: string) {
    await api(`/applications/${appId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (selectedJobId) {
      const list = await api<ApplicationItem[]>(`/applications/for-job/${selectedJobId}`);
      setApplications(list);
    }
    loadStats();
  }

  if (!stats || !jobs) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container section">
      <p className="eyebrow">Hiring</p>
      <h1 className="page-title">Employer dashboard</h1>
      <p className="page-intro">Post roles and review applications from learners.</p>
      {error && <div className="error-banner">{error}</div>}
      <div className="dashboard-grid">
        <div className="dash-stat">
          <strong>{stats.jobsPosted}</strong>
          <span className="muted">Active listings</span>
        </div>
        <div className="dash-stat">
          <strong>{stats.totalApplications}</strong>
          <span className="muted">Total applications</span>
        </div>
        <div className="dash-stat">
          <strong>{stats.pendingApplications}</strong>
          <span className="muted">Pending review</span>
        </div>
      </div>

      <div className="admin-panel" style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Post a job</h2>
        <form onSubmit={postJob}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="desc">Description</label>
            <textarea
              id="desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="loc">Location</label>
            <input
              id="loc"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="sal">Salary / compensation note</label>
            <input
              id="sal"
              value={form.salary}
              onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Publish job
          </button>
        </form>
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>Your listings</h2>
      <ul className="lesson-list">
        {jobs.length === 0 && <li className="muted">No jobs posted yet.</li>}
        {jobs.map((j) => (
          <li key={j.id} className="lesson-item">
            <strong>{j.title}</strong>
            <p className="muted small" style={{ margin: "0.25rem 0" }}>
              Posted {new Date(j.createdAt).toLocaleDateString()}
            </p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setSelectedJobId(j.id === selectedJobId ? null : j.id)}
            >
              {j.id === selectedJobId ? "Hide applications" : "View applications"}
            </button>
          </li>
        ))}
      </ul>

      {selectedJobId && applications && (
        <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
          <h3 style={{ marginTop: 0 }}>Applications</h3>
          {applications.length === 0 && <p className="muted">No applications yet.</p>}
          <table className="simple">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Note</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.learnerName}
                    <br />
                    <span className="muted small">{a.learnerEmail}</span>
                  </td>
                  <td style={{ maxWidth: "220px", whiteSpace: "pre-wrap" }}>{a.coverLetter}</td>
                  <td>
                    <select
                      value={a.status}
                      onChange={(e) => setStatus(a.id, e.target.value)}
                      aria-label={`Status for ${a.learnerName}`}
                    >
                      <option value="pending">pending</option>
                      <option value="reviewed">reviewed</option>
                      <option value="shortlisted">shortlisted</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
