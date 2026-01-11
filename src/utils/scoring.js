function clamp(n, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

export function computeScores(snapshot) {
  const s = snapshot || {};
  const perf = s.perf || {};
  const net = s.net || {};
  const storage = s.storage || {};
  const privacy = s.system || {};
  const a11y = s.a11y || {};

  // Performance readiness
  let p = 100;
  if (perf.eventLoopLagMs != null) p -= clamp(perf.eventLoopLagMs * 1.4, 0, 45);
  if (perf.longTasks?.count) p -= clamp(perf.longTasks.count * 6, 0, 35);
  if (perf.fps != null) p -= clamp((60 - perf.fps) * 0.7, 0, 30);
  if (s.battery?.level != null && s.battery.level <= 20) p -= 10;
  p = clamp(Math.round(p));

  const perfReason =
    p >= 75
      ? "Smooth operation expected for most apps."
      : p >= 55
      ? "Some stutter possible under load (tabs/extensions)."
      : "Performance likely degraded; consider reducing background load.";

  // Network readiness
  let n = 100;
  if (!s.online) n = 20;
  if (net.rtt != null) n -= clamp((net.rtt - 50) * 0.35, 0, 55);
  if (net.downlink != null) n -= clamp((10 - net.downlink) * 2, 0, 25);
  if (net.saveData) n -= 6;
  n = clamp(Math.round(n));

  const netReason = !s.online
    ? "Offline detected — real-time services will fail."
    : n >= 75
    ? "Good for real-time apps and streaming."
    : n >= 55
    ? "Moderate latency; voice/video may degrade."
    : "High latency/low throughput likely impacts real-time apps.";

  // Media readiness
  let m = 80;
  const mv = s.media?.video || [];
  const ma = s.media?.audio || [];
  const goodVideo = mv.filter((x) => x.ok).length;
  const goodAudio = ma.filter((x) => x.ok).length;
  m += clamp(goodVideo * 5, 0, 15);
  m += clamp(goodAudio * 3, 0, 10);
  m = clamp(Math.round(m));

  const mediaReason =
    m >= 80
      ? "Strong codec support for playback and streaming."
      : m >= 60
      ? "Some formats may fail; try alternative containers/codecs."
      : "Limited codec support reported by the browser.";

  // Storage reliability
  let st = 100;
  if (storage.localStorageBytes == null) st = 35;
  if (storage.indexedDBOk === false) st -= 20;
  if (storage.persisted === false) st -= 10;
  if (storage.estimate?.usage != null && storage.estimate?.quota != null) {
    const pct = storage.estimate.usage / Math.max(1, storage.estimate.quota);
    if (pct > 0.9) st -= 25;
    else if (pct > 0.75) st -= 12;
  }
  st = clamp(Math.round(st));

  const storageReason =
    st >= 80
      ? "Local storage looks stable for offline-friendly apps."
      : st >= 55
      ? "Some persistence risk; storage may be cleared."
      : "Storage access is limited; data loss is more likely.";

  // Privacy “lockdown” (higher means more privacy restrictions)
  let pr = 50;
  if (privacy.dnt === "Enabled") pr += 10;
  if (privacy.cookies === "Disabled") pr += 15;
  if (a11y.forcedColors === "Active") pr += 5;
  // permissions: if everything denied, likely lockdown (but don’t shame)
  const perms = s.permissions ? Object.values(s.permissions) : [];
  const denied = perms.filter((x) => x === "denied").length;
  pr += clamp(denied * 4, 0, 20);
  pr = clamp(Math.round(pr));

  const privacyReason =
    pr >= 75
      ? "Privacy restrictions likely reduce API visibility."
      : pr >= 55
      ? "Moderate privacy settings; some signals may be capped."
      : "Minimal privacy restrictions detected by the browser.";

  return {
    performance: { score: p, reason: perfReason },
    network: { score: n, reason: netReason },
    media: { score: m, reason: mediaReason },
    storage: { score: st, reason: storageReason },
    privacy: { score: pr, reason: privacyReason },
  };
}

export function buildHumanSummary(snapshot, scores) {
  const s = snapshot || {};
  const sc = scores || {};

  const lines = [];
  lines.push("NEXUS Diagnostics — Support Summary");
  lines.push(`Generated: ${new Date().toString()}`);
  lines.push("");
  lines.push(`Status: ${s.online ? "Online" : "Offline"}`);
  lines.push(
    `Browser: ${s.system?.browser ?? "—"} | Platform: ${
      s.system?.platform ?? "—"
    } | Lang: ${s.system?.lang ?? "—"}`
  );
  lines.push(
    `Cores: ${s.system?.cores ?? "—"} | Memory (reported): ${
      s.system?.deviceMemoryGB ? `${s.system.deviceMemoryGB} GB` : "—"
    }`
  );
  lines.push(
    `Display: ${s.display?.resolution ?? "—"} | Viewport: ${
      s.display?.viewport ?? "—"
    } | DPR: ${s.display?.pixelRatio ?? "—"}`
  );
  lines.push("");
  lines.push("Network:");
  lines.push(
    `- Type: ${s.net?.effectiveType ?? "—"} | RTT: ${
      s.net?.rtt ?? "—"
    } ms | Downlink: ${s.net?.downlink ?? "—"} Mbps | Save-Data: ${
      s.net?.saveData ? "Yes" : "No"
    }`
  );
  lines.push("");
  lines.push("Performance:");
  lines.push(
    `- FPS: ${s.perf?.fps ?? "—"} | Event-loop lag: ${
      s.perf?.eventLoopLagMs != null
        ? `${s.perf.eventLoopLagMs.toFixed(1)} ms`
        : "—"
    } | Long tasks: ${s.perf?.longTasks?.count ?? "—"}`
  );
  lines.push("");
  lines.push("Storage:");
  lines.push(
    `- localStorage: ${s.storage?.localStorageHuman ?? "—"} | IndexedDB: ${
      s.storage?.indexedDBOk === true
        ? "OK"
        : s.storage?.indexedDBOk === false
        ? "Blocked/Fail"
        : "—"
    }`
  );
  lines.push(
    `- Persisted: ${
      s.storage?.persisted == null ? "—" : s.storage.persisted ? "Yes" : "No"
    }`
  );
  lines.push("");
  lines.push("Scores (0–100):");
  lines.push(
    `- Performance: ${sc.performance?.score ?? "—"} | Network: ${
      sc.network?.score ?? "—"
    } | Media: ${sc.media?.score ?? "—"} | Storage: ${
      sc.storage?.score ?? "—"
    } | Privacy: ${sc.privacy?.score ?? "—"}`
  );
  lines.push("");
  lines.push("Notes:");
  lines.push("- This report is generated client-side. No upload occurs.");
  return lines.join("\n");
}
