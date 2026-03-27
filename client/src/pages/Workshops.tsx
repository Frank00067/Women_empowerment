import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

interface Workshop {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
}

export function Workshops() {
  const [workshops, setWorkshops] = useState<Workshop[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    sb.from("workshops").select("*").order("date")
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); return; }
        setWorkshops(data ?? []);
      });
  }, []);

  if (error) return <div className="container section"><div className="error-banner">{error}</div></div>;
  if (!workshops) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="container section">
      <p className="eyebrow">Learn</p>
      <h1 className="page-title">Workshops</h1>
      <p className="page-intro">Hands-on sessions to build your digital and career skills.</p>

      {workshops.length === 0 ? (
        <p className="muted">No workshops available yet.</p>
      ) : (
        <div className="card-grid">
          {workshops.map((w) => (
            <div key={w.id} className="course-card">
              <span className="badge">{w.category}</span>
              <h3 style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>{w.title}</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>{w.description}</p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem", color: "var(--teal)" }}>
                📅 {new Date(w.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
