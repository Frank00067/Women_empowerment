import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";

interface CvData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
}

const empty: CvData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  skills: "",
  experience: "",
  education: "",
};

export function CVBuilder() {
  const [cv, setCv] = useState<CvData>(empty);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Partial<CvData>>("/profile/cv")
      .then((data) => setCv({ ...empty, ...data }))
      .catch(() => setCv(empty));
  }, []);

  function update<K extends keyof CvData>(key: K, value: CvData[K]) {
    setCv((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/profile/cv", { method: "PUT", body: JSON.stringify(cv) });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="container section">
      <p className="eyebrow">Career tools</p>
      <h1 className="page-title">CV / Resume builder</h1>
      <p className="page-intro">
        Fill out the sections on the left — your preview updates live. Save to store it on your
        profile.
      </p>
      {error && <div className="error-banner">{error}</div>}
      {saved && (
        <p className="muted" style={{ color: "var(--teal)", fontWeight: 600 }}>
          Saved to your profile.
        </p>
      )}
      <div className="cv-grid">
        <form onSubmit={onSubmit}>
          {(
            [
              ["fullName", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["location", "Location"],
            ] as const
          ).map(([key, label]) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{label}</label>
              <input id={key} value={cv[key]} onChange={(e) => update(key, e.target.value)} />
            </div>
          ))}
          <div className="field">
            <label htmlFor="summary">Professional summary</label>
            <textarea
              id="summary"
              value={cv.summary}
              onChange={(e) => update("summary", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="skills">Skills (comma-separated or short lines)</label>
            <textarea
              id="skills"
              value={cv.skills}
              onChange={(e) => update("skills", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="experience">Experience</label>
            <textarea
              id="experience"
              value={cv.experience}
              onChange={(e) => update("experience", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="education">Education</label>
            <textarea
              id="education"
              value={cv.education}
              onChange={(e) => update("education", e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Save to profile
          </button>
        </form>
        <aside className="cv-preview" aria-label="Live preview">
          <h2>{cv.fullName || "Your name"}</h2>
          <div className="contact">
            {[cv.email, cv.phone, cv.location].filter(Boolean).join(" · ")}
          </div>
          {cv.summary && (
            <section>
              <h3>Summary</h3>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{cv.summary}</p>
            </section>
          )}
          {cv.skills && (
            <section>
              <h3>Skills</h3>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{cv.skills}</p>
            </section>
          )}
          {cv.experience && (
            <section>
              <h3>Experience</h3>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{cv.experience}</p>
            </section>
          )}
          {cv.education && (
            <section>
              <h3>Education</h3>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{cv.education}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
