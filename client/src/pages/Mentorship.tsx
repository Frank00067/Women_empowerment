import { useEffect, useState } from "react";
import { api } from "../api";
import type { ResourceItem } from "../types";

interface Mentor {
  id: number;
  name: string;
  category: string;
  bio: string;
  avatar: string;
}

export function Mentorship() {
  const [mentors, setMentors] = useState<Mentor[] | null>(null);
  const [resources, setResources] = useState<ResourceItem[] | null>(null);
  const [requested, setRequested] = useState<Set<number>>(new Set());
  const [requesting, setRequesting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Mentor[]>("/mentors"),
      api<ResourceItem[]>("/resources"),
    ])
      .then(([m, r]) => { setMentors(m); setResources(r); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  async function requestMentor(mentorId: number) {
    setRequesting(mentorId);
    try {
      await api(`/mentors/${mentorId}/request`, { method: "POST", body: JSON.stringify({ message: "" }) });
      setRequested((prev) => new Set(prev).add(mentorId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Request failed");
    } finally {
      setRequesting(null);
    }
  }

  if (error) return <div className="container section"><div className="error-banner">{error}</div></div>;
  if (!mentors || !resources) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="container section">
      <p className="eyebrow">Support</p>
      <h1 className="page-title">Mentorship & Resources</h1>
      <p className="page-intro">Connect with a mentor or explore curated guides to support your growth.</p>

      {/* Mentors */}
      <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Meet our mentors</h2>
      {mentors.length === 0 ? (
        <p className="muted">No mentors available yet.</p>
      ) : (
        <div className="card-grid" style={{ marginBottom: "3rem" }}>
          {mentors.map((m) => (
            <div key={m.id} className="course-card">
              <span className="badge">{m.category}</span>
              <h3 style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>{m.name}</h3>
              {m.bio && <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>{m.bio}</p>}
              <button
                className="btn btn-primary"
                style={{ marginTop: "0.75rem", width: "100%" }}
                disabled={requested.has(m.id) || requesting === m.id}
                onClick={() => requestMentor(m.id)}
              >
                {requested.has(m.id) ? "✓ Requested" : requesting === m.id ? "Sending…" : "Request mentorship"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Resources */}
      <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Resources</h2>
      {resources.length === 0 ? (
        <p className="muted">No resources yet. Admins can add them from the admin dashboard.</p>
      ) : (
        <div className="resource-cards">
          {resources.map((r) => (
            <div key={r.id} className="resource-row">
              <div style={{ flex: 1 }}>
                <span className="resource-type">{r.type}</span>
                <h2 style={{ margin: "0.25rem 0", fontSize: "1.1rem" }}>{r.title}</h2>
                {r.description && <p className="muted" style={{ margin: 0 }}>{r.description}</p>}
                <p style={{ margin: "0.5rem 0 0" }}>
                  <a href={r.url} target="_blank" rel="noreferrer">Open resource →</a>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
