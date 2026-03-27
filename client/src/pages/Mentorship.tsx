import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { api } from "../api";
import type { ResourceItem } from "../types";

interface Mentor {
  id: string;
  name: string;
  category: string;
  bio: string;
}

export function Mentorship() {
  const [mentors, setMentors] = useState<Mentor[] | null>(null);
  const [resources, setResources] = useState<ResourceItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    Promise.all([
      sb.from("mentors").select("*").order("name"),
      api<ResourceItem[]>("/resources"),
    ])
      .then(([{ data, error: err }, r]) => {
        if (err) throw new Error(err.message);
        setMentors(data ?? []);
        setResources(r);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) return <div className="container section"><div className="error-banner">{error}</div></div>;
  if (!mentors || !resources) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="container section">
      <p className="eyebrow">Support</p>
      <h1 className="page-title">Mentorship & Resources</h1>
      <p className="page-intro">Connect with a mentor or explore curated guides to support your growth.</p>

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
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Resources</h2>
      {resources.length === 0 ? (
        <p className="muted">No resources yet.</p>
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
