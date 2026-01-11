import React, { useMemo } from "react";
import { listSnapshots } from "../utils/snapshot.js";

export default function TimelinePanel() {
  const items = useMemo(() => {
    const list = listSnapshots();
    return list.slice(0, 14); // last ~2 weeks
  }, []);

  return (
    <section className="card">
      <div className="cardTitle">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>Timeline</span>
          <span className="pill">HISTORY</span>
        </div>
      </div>

      {!items.length ? (
        <div className="small">
          No timeline yet. Save a Daily Snapshot to start building history.
        </div>
      ) : (
        <div className="timeline">
          {items.map((s) => (
            <div className="timelineItem" key={s.meta.id}>
              <div className="timelineDay">{s.meta.label}</div>
              <div className="timelineMeta small">
                {new Date(s.meta.ts).toLocaleTimeString()} •{" "}
                {s.online ? "Online" : "Offline"} •{" "}
                {s.net?.effectiveType ?? "NET —"}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
