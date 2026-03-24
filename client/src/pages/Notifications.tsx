import { useEffect, useState } from "react";
import { api } from "../api";
import type { NotificationItem } from "../types";

export function Notifications() {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api<NotificationItem[]>("/notifications")
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await api(`/notifications/${id}/read`, { method: "PATCH" });
    load();
  }

  async function markAll() {
    await api("/notifications/read-all", { method: "POST" });
    load();
  }

  if (error) {
    return (
      <div className="container section">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p className="eyebrow">Activity</p>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Notifications
          </h1>
        </div>
        {items.some((n) => !n.read) && (
          <button type="button" className="btn btn-outline" onClick={markAll}>
            Mark all read
          </button>
        )}
      </div>
      <p className="page-intro">Jobs, applications, and course milestones appear here.</p>
      {items.length === 0 && <p className="muted">You're all caught up.</p>}
      <ul className="notif-list">
        {items.map((n) => (
          <li key={n.id} className={`notif-item ${n.read ? "" : "unread"}`}>
            <strong>{n.title}</strong>
            <p className="muted" style={{ margin: "0.35rem 0" }}>
              {n.message}
            </p>
            <p className="muted small" style={{ margin: 0 }}>
              {new Date(n.createdAt).toLocaleString()}
              {!n.read && (
                <>
                  {" · "}
                  <button type="button" className="btn btn-ghost" style={{ padding: 0, display: "inline" }} onClick={() => markRead(n.id)}>
                    Mark read
                  </button>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
