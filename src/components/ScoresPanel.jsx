import React from "react";

function Bar({ label, score, desc }) {
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const tone =
    pct >= 75 ? "var(--good)" : pct >= 55 ? "var(--neon)" : "var(--warn)";

  return (
    <div className="scoreRow">
      <div className="scoreTop">
        <div className="scoreLabel">{label}</div>
        <div className="scoreVal" style={{ color: tone }}>
          {score == null ? "—" : `${score}`}
        </div>
      </div>
      <div className="scoreBar">
        <div className="scoreFill" style={{ width: `${pct}%` }} />
      </div>
      <div className="small">{desc}</div>
    </div>
  );
}

export default function ScoresPanel({ snapshot, scores }) {
  const s = scores || {};
  return (
    <div className="grid2">
      <section className="card">
        <div className="cardTitle">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>Readiness Scores</span>
            <span className="pill">HUD</span>
          </div>
        </div>

        <Bar
          label="Performance Readiness"
          score={s.performance?.score}
          desc={s.performance?.reason}
        />
        <div className="sep" />
        <Bar
          label="Network Readiness"
          score={s.network?.score}
          desc={s.network?.reason}
        />
        <div className="sep" />
        <Bar
          label="Media/Playback Readiness"
          score={s.media?.score}
          desc={s.media?.reason}
        />
        <div className="sep" />
        <Bar
          label="Offline/Storage Reliability"
          score={s.storage?.score}
          desc={s.storage?.reason}
        />
        <div className="sep" />
        <Bar
          label="Privacy Lockdown"
          score={s.privacy?.score}
          desc={s.privacy?.reason}
        />
      </section>

      <section className="card">
        <div className="cardTitle">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>Why This Matters</span>
            <span className="pill">EXPLAIN</span>
          </div>
        </div>

        <div className="small">
          <p style={{ margin: "0 0 10px" }}>
            These are <b>interpretable domains</b>, not a single “grade.” They
            update live and help you spot when something changes (network
            congestion, blocked storage, reduced motion, throttling).
          </p>
          <p style={{ margin: "0 0 10px" }}>
            Scores are built from the signals your browser already exposes.
            Nothing is uploaded. Nothing is fingerprinted.
          </p>
          <p style={{ margin: 0 }}>
            Use <b>Daily Snapshot</b> to compare changes over time and export a
            clean report when needed.
          </p>
        </div>
      </section>
    </div>
  );
}
