import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import type { CertificateItem, ResourceItem } from "../types";

interface AdminDash {
  totalUsers: number;
  learners: number;
  employers: number;
  admins: number;
  courses: number;
  certificatesIssued: number;
  resources: number;
  jobs: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminDash | null>(null);
  const [certs, setCerts] = useState<CertificateItem[] | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    category: "",
    lessons: "Intro|Welcome\nBasics|Core ideas",
  });
  const [resourceForm, setResourceForm] = useState({
    title: "",
    type: "link" as "pdf" | "link" | "video",
    url: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<ResourceItem[] | null>(null);

  function refresh() {
    api<AdminDash>("/dashboard/admin").then(setStats).catch(() => {});
    api<CertificateItem[]>("/certificates").then(setCerts).catch(() => {});
    api<ResourceItem[]>("/resources").then(setResources).catch(() => {});
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addCourse(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const lines = courseForm.lessons
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const lessons = lines.map((line) => {
      const [title, ...rest] = line.split("|");
      return {
        title: title.trim(),
        content: (rest.join("|") || title).trim(),
      };
    });
    try {
      await api("/courses", {
        method: "POST",
        body: JSON.stringify({
          title: courseForm.title,
          description: courseForm.description,
          category: courseForm.category,
          lessons,
        }),
      });
      setCourseForm({
        title: "",
        description: "",
        category: "",
        lessons: "Lesson title|Lesson content",
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function addResource(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/resources", {
        method: "POST",
        body: JSON.stringify(resourceForm),
      });
      setResourceForm({ title: "", type: "link", url: "", description: "" });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  if (!stats || !certs || !resources) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container section">
      <p className="eyebrow">Administration</p>
      <h1 className="page-title">Admin dashboard</h1>
      <p className="page-intro">Platform stats, certificates issued, and content tools.</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-grid">
        <div className="dash-stat">
          <strong>{stats.totalUsers}</strong>
          <span className="muted">Users</span>
        </div>
        <div className="dash-stat">
          <strong>{stats.learners}</strong>
          <span className="muted">Learners</span>
        </div>
        <div className="dash-stat">
          <strong>{stats.employers}</strong>
          <span className="muted">Employers</span>
        </div>
        <div className="dash-stat">
          <strong>{stats.courses}</strong>
          <span className="muted">Courses</span>
        </div>
        <div className="dash-stat">
          <strong>{stats.certificatesIssued}</strong>
          <span className="muted">Certificates</span>
        </div>
        <div className="dash-stat">
          <strong>{stats.resources}</strong>
          <span className="muted">Resources</span>
        </div>
        <div className="dash-stat">
          <strong>{stats.jobs}</strong>
          <span className="muted">Jobs</span>
        </div>
      </div>

      <div className="admin-tools">
        <div className="admin-panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Create course</h2>
          <p className="muted small">
            One lesson per line: <code>Title|Content text</code>
          </p>
          <form onSubmit={addCourse}>
            <div className="field">
              <label>Title</label>
              <input
                value={courseForm.title}
                onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Category</label>
              <input
                value={courseForm.category}
                onChange={(e) => setCourseForm((f) => ({ ...f, category: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Lessons</label>
              <textarea
                value={courseForm.lessons}
                onChange={(e) => setCourseForm((f) => ({ ...f, lessons: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Add course
            </button>
          </form>
        </div>

        <div className="admin-panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Add mentorship resource</h2>
          <form onSubmit={addResource}>
            <div className="field">
              <label>Title</label>
              <input
                value={resourceForm.title}
                onChange={(e) => setResourceForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Type</label>
              <select
                value={resourceForm.type}
                onChange={(e) =>
                  setResourceForm((f) => ({ ...f, type: e.target.value as ResourceItem["type"] }))
                }
              >
                <option value="link">link</option>
                <option value="pdf">pdf</option>
                <option value="video">video</option>
              </select>
            </div>
            <div className="field">
              <label>URL</label>
              <input
                value={resourceForm.url}
                onChange={(e) => setResourceForm((f) => ({ ...f, url: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Description</label>
              <input
                value={resourceForm.description}
                onChange={(e) => setResourceForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Add resource
            </button>
          </form>
        </div>

        <div className="admin-panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Certificates issued</h2>
          <table className="simple">
            <thead>
              <tr>
                <th>Learner</th>
                <th>Course</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {certs.slice(0, 25).map((c) => (
                <tr key={c.id}>
                  <td>
                    {(c as CertificateItem & { userName?: string }).userName ?? c.userId}
                  </td>
                  <td>{(c as CertificateItem & { courseTitle?: string }).courseTitle ?? c.courseId}</td>
                  <td>{new Date(c.issuedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
