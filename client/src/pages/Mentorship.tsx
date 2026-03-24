import { useEffect, useState } from "react";
import { api } from "../api";
import type { ResourceItem } from "../types";

export function Mentorship() {
  const [resources, setResources] = useState<ResourceItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ResourceItem[]>("/resources")
      .then(setResources)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  if (error) {
    return (
      <div className="container section">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!resources) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container section">
      <p className="eyebrow">Support</p>
      <h1 className="page-title">Mentorship & resources</h1>
      <p className="page-intro">
        Curated guides, links, and media to support your growth. Admins can add more from the admin
        dashboard.
      </p>
      <div className="resource-cards">
        {resources.map((r) => (
          <div key={r.id} className="resource-row">
            <div style={{ flex: 1 }}>
              <span className="resource-type">{r.type}</span>
              <h2 style={{ margin: "0.25rem 0", fontSize: "1.1rem" }}>{r.title}</h2>
              {r.description && <p className="muted" style={{ margin: 0 }}>{r.description}</p>}
              <p style={{ margin: "0.5rem 0 0" }}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  Open resource →
                </a>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
