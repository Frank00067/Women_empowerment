import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { CourseListItem } from "../types";

export function Courses() {
  const [courses, setCourses] = useState<CourseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<CourseListItem[]>("/courses")
      .then(setCourses)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) {
    return (
      <div className="container section">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!courses) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading courses…</p>
      </div>
    );
  }

  return (
    <div className="container section">
      <p className="eyebrow">Digital skills</p>
      <h1 className="page-title">Courses</h1>
      <p className="page-intro">
        Self-paced modules on Word, Excel, and core digital literacy. Complete all lessons in a
        course to earn a certificate.
      </p>
      <div className="card-grid">
        {courses.map((c) => (
          <article key={c.id} className="course-card">
            <span className="badge">{c.category}</span>
            <h2 style={{ margin: "0.25rem 0", fontSize: "1.2rem" }}>{c.title}</h2>
            <p className="muted" style={{ flex: 1, margin: 0 }}>
              {c.description}
            </p>
            <p className="muted small">{c.lessonCount} lessons</p>
            <Link to={`/courses/${c.id}`} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              Open course
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
