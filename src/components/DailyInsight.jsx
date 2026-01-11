import React, { useMemo } from "react";

function dayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DailyInsight({ snapshot, scores }) {
  const text = useMemo(() => {
    const k = dayKey();
    const seed = k.split("-").join("");
    const n = Number(seed.slice(-4)) || 0;

    const s = snapshot || {};
    const perf = scores?.performance?.score ?? null;
    const net = scores?.network?.score ?? null;

    const tips = [];

    if (s.online === false)
      tips.push(
        "You appear offline right now — exports still work because everything runs locally."
      );
    if (s.eventLoopLagMs != null && s.eventLoopLagMs > 25)
      tips.push(
        "Responsiveness looks degraded (event-loop lag elevated). Closing heavy tabs may help."
      );
    if (s.longTasks?.count >= 3)
      tips.push(
        "Multiple long tasks detected — UI stutters are likely under load."
      );
    if (s.battery?.level != null && s.battery.level <= 20)
      tips.push(
        "Battery is low — some devices throttle performance to conserve power."
      );
    if (perf != null && perf < 55)
      tips.push(
        "Performance readiness is reduced — consider trimming extensions or heavy background apps."
      );
    if (net != null && net < 55)
      tips.push(
        "Network readiness is reduced — latency or RTT may be impacting real-time apps."
      );

    const rotating = [
      "Pro tip: Save a Daily Snapshot so you can compare today vs tomorrow in one click.",
      "Pro tip: Use Focus mode on mobile for a cleaner HUD view.",
      "Pro tip: Export a redacted JSON when sharing diagnostics publicly.",
      "Pro tip: The codec panel can explain “why video won’t play” instantly.",
    ];

    const r = rotating[n % rotating.length];
    const primary = tips[0] || r;

    return primary;
  }, [snapshot, scores]);

  return (
    <div className="insight">
      <div className="insightTitle">Daily Insight</div>
      <div className="insightText">{text}</div>
    </div>
  );
}
