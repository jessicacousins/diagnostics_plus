import React, { useEffect, useMemo, useState } from "react";

function key() {
  return "nexus_notify_enabled";
}

export default function NotificationsPanel({ snapshot, onToast }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setSupported("Notification" in window);
    try {
      setEnabled(localStorage.getItem(key()) === "1");
    } catch {
      setEnabled(false);
    }
  }, []);

  const importantChange = useMemo(() => {
    const s = snapshot || {};
    if (s.online === false)
      return {
        title: "Offline detected",
        msg: "You appear offline right now.",
      };
    if (s.eventLoopLagMs != null && s.eventLoopLagMs > 35)
      return {
        title: "High lag",
        msg: "Responsiveness degraded (event-loop lag elevated).",
      };
    if (s.storage?.localStorageBytes == null)
      return {
        title: "Storage blocked",
        msg: "localStorage appears unavailable.",
      };
    if (s.net?.rtt != null && s.net.rtt > 25020)
      return {
        title: "High RTT",
        msg: `Reported RTT is high (${s.net.rtt} ms).`,
      };
    return null;
  }, [snapshot]);

  async function enable() {
    if (!supported) {
      onToast?.("Notifications", "Not supported in this browser.");
      return;
    }
    try {
      const p = await Notification.requestPermission();
      if (p !== "granted") {
        onToast?.("Notifications", "Permission not granted.");
        return;
      }
      localStorage.setItem(key(), "1");
      setEnabled(true);
      onToast?.("Notifications", "Enabled (opt-in).");
    } catch {
      onToast?.("Notifications", "Blocked by browser.");
    }
  }

  function disable() {
    try {
      localStorage.setItem(key(), "0");
      setEnabled(false);
      onToast?.("Notifications", "Disabled.");
    } catch {
      setEnabled(false);
    }
  }

  // passive notify only when enabled + something important exists
  useEffect(() => {
    if (!enabled) return;
    if (!importantChange) return;
    if (!supported) return;
    try {
      if (Notification.permission !== "granted") return;
      // lightweight cooldown
      const k = "nexus_notify_last";
      const last = Number(localStorage.getItem(k) || "0");
      const now = Date.now();
      if (now - last < 60_000) return;
      localStorage.setItem(k, String(now));
      new Notification(`NEXUS: ${importantChange.title}`, {
        body: importantChange.msg,
      });
    } catch {
      // ignore
    }
  }, [enabled, importantChange, supported]);

  return (
    <section className="card">
      <div className="cardTitle">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>Opt-in Alerts</span>
          <span className="pill">SAFE</span>
        </div>
      </div>

      <div className="small" style={{ marginBottom: 10 }}>
        Optional notifications for major changes (offline, blocked storage,
        severe lag). No tracking. Local-only.
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!enabled ? (
          <button
            className="btn btnPrimary"
            onClick={enable}
            disabled={!supported}
          >
            Enable Alerts
          </button>
        ) : (
          <button className="btn" onClick={disable}>
            Disable Alerts
          </button>
        )}
        <div className="miniBadge">
          <span className={`dot ${enabled ? "dotGood" : "dotWarn"}`} />
          <span>
            {supported ? (enabled ? "Enabled" : "Off") : "Unsupported"}
          </span>
        </div>
      </div>
    </section>
  );
}
