import React, { useMemo, useState } from "react";
import {
  saveDailySnapshot,
  getLastSnapshots,
  diffSnapshots,
} from "../utils/snapshot.js";

export default function DailySnapshotPanel({ snapshot, onSaved, onToast }) {
  const [busy, setBusy] = useState(false);

  const last = useMemo(() => {
    const [prev, cur] = getLastSnapshots(2);
    return { prev, cur };
  }, []);

  const hasToday = useMemo(() => {
    try {
      const day = new Date().toDateString();
      const [_, cur] = getLastSnapshots(1);
      return cur?.meta?.day === day;
    } catch {
      return false;
    }
  }, []);

  function save() {
    if (!snapshot || busy) return;
    setBusy(true);
    try {
      const { saved, previous } = saveDailySnapshot(snapshot);
      onSaved?.(saved, previous);
      onToast?.("Daily snapshot saved", saved.meta.label);
    } catch {
      onToast?.("Snapshot failed", "Storage blocked or unavailable.");
    } finally {
      setBusy(false);
    }
  }

  let subtitle = "Save one snapshot per day and see what changed.";
  try {
    const [prev, cur] = getLastSnapshots(2);
    if (prev && cur) {
      const d = diffSnapshots(prev, cur);
      subtitle = d.summary;
    }
  } catch {
    /* ignore */
  }

  return (
    <section className="card">
      <div className="cardTitle">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>Daily Snapshot</span>
          <span className="pill">HABIT</span>
        </div>
      </div>

      <div className="small" style={{ marginBottom: 10 }}>
        {subtitle}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          className="btn btnPrimary"
          onClick={save}
          disabled={busy || !snapshot}
        >
          {busy ? "Saving…" : hasToday ? "Save Again (Today)" : "Save Today"}
        </button>
        <button
          className="btn btnGhost"
          onClick={() => {
            try {
              const list = JSON.parse(
                localStorage.getItem("nexus_snapshots") || "[]"
              );
              onToast?.("Snapshots", `${list.length} saved locally`);
            } catch {
              onToast?.("Snapshots", "Unavailable");
            }
          }}
        >
          Quick Count
        </button>
      </div>
    </section>
  );
}
