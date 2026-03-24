import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { CourseDetail } from "../types";

export function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<{ completedLessonIds: string[]; total: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<CourseDetail>(`/courses/${id}`)
      .then(setCourse)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [id]);

  useEffect(() => {
    if (!id || !user || user.role !== "learner") return;
    api<{ completedLessonIds: string[]; total: number }>(`/courses/${id}/progress`)
      .then(setProgress)
      .catch(() => setProgress({ completedLessonIds: [], total: 0 }));
  }, [id, user]);

  async function completeLesson(lessonId: string) {
    if (!id || user?.role !== "learner") return;
    try {
      await api(`/courses/${id}/lessons/${lessonId}/complete`, { method: "POST" });
      const p = await api<{ completedLessonIds: string[]; total: number }>(
        `/courses/${id}/progress`
      );
      setProgress(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save progress");
    }
  }

  if (error && !course) {
    return (
      <div className="container section">
        <div className="error-banner">{error}</div>
        <Link to="/courses">Back to courses</Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  const lessons = course.lessons ?? [];
  const doneSet = new Set(progress?.completedLessonIds ?? []);

  return (
    <div className="container section">
      <Link to="/courses" className="muted small">
        ← All courses
      </Link>
      <p className="eyebrow" style={{ marginTop: "1rem" }}>
        {course.category}
      </p>
      <h1 className="page-title">{course.title}</h1>
      <p className="page-intro">{course.description}</p>
      {user?.role === "learner" && progress && (
        <p className="muted">
          Progress: {progress.completedLessonIds.length} / {progress.total} lessons complete
        </p>
      )}
      {error && <div className="error-banner">{error}</div>}
      <ul className="lesson-list">
        {lessons.map((l) => {
          const done = doneSet.has(l.id);
          return (
            <li key={l.id} className={`lesson-item ${done ? "done" : ""}`}>
              <strong>{l.title}</strong>
              <p className="muted" style={{ margin: "0.35rem 0" }}>
                {l.content}
              </p>
              {user?.role === "learner" && (
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={done}
                  onClick={() => completeLesson(l.id)}
                >
                  {done ? "Completed" : "Mark complete"}
                </button>
              )}
              {!user && (
                <p className="muted small" style={{ marginBottom: 0 }}>
                  <Link to="/login">Log in</Link> as a learner to track progress.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
