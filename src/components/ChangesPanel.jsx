import React, { useMemo } from "react";

export default function ChangesPanel({ diff, lastSaved }) {
  const items = useMemo(() => diff?.items || [], [diff]);

  return (
    <section className="card">
      <div className="cardTitle">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>What Changed</span>
          <span className="pill">DELTA</span>
        </div>
      </div>

      {!lastSaved ? (
        <div className="small">
          Save a snapshot to start tracking changes day-to-day.
        </div>
      ) : !diff ? (
        <div className="small">Saved. No previous snapshot to compare yet.</div>
      ) : (
        <>
          <div className="small" style={{ marginBottom: 10 }}>
            {diff.summary}
          </div>
          {items.slice(0, 8).map((x) => (
            <div className="row" key={x.key}>
              <div className="label">{x.label}</div>
              <div className="value">
                {x.from} → {x.to}
              </div>
            </div>
          ))}
          {items.length > 8 ? (
            <div className="small" style={{ marginTop: 8 }}>
              +{items.length - 8} more changes (see CLI: <b>snapshot diff</b>)
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
