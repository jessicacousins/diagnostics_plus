import React, { useMemo, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Card from "./components/Card.jsx";
import StatRow from "./components/StatRow.jsx";
import Terminal from "./components/Terminal.jsx";
import PingTest from "./components/PingTest.jsx";
import ExportPDF from "./components/ExportPDF.jsx";
import { ToastProvider, useToasts } from "./components/Toasts.jsx";
import { useSystemInfo } from "./hooks/useSystemInfo.js";
import { useNetworkInfo } from "./hooks/useNetworkInfo.js";
import { useStorageUsage } from "./hooks/useStorageUsage.js";
import { useClock } from "./hooks/useClock.js";
import { useOnline } from "./hooks/useOnline.js";
import { formatBytes } from "./utils/format.js";
import DailyInsight from "./components/DailyInsight.jsx";
import ScoresPanel from "./components/ScoresPanel.jsx";
import DailySnapshotPanel from "./components/DailySnapshotPanel.jsx";
import TimelinePanel from "./components/TimelinePanel.jsx";
import ChangesPanel from "./components/ChangesPanel.jsx";
import ExportsPanel from "./components/ExportsPanel.jsx";
import NotificationsPanel from "./components/NotificationsPanel.jsx";
import ModeToggle from "./components/ModeToggle.jsx";
import TrustBlock from "./components/TrustBlock.jsx";

import { useMode } from "./hooks/useMode.js";
import { buildSnapshot, diffSnapshots } from "./utils/snapshot.js";
import { computeScores, buildHumanSummary } from "./utils/scoring.js";

function AppInner() {
  const { push } = useToasts();
  const { info, display } = useSystemInfo();
  const net = useNetworkInfo();
  const { bytes, refresh } = useStorageUsage();
  const { time, date } = useClock();
  const online = useOnline();
  const [latency, setLatency] = useState(null);
  const [fps, setFps] = useState(null);
  const [eventLoopLag, setEventLoopLag] = useState(null);
  const [longTasks, setLongTasks] = useState({ count: 0, lastMs: null });
  const [heap, setHeap] = useState(null);
  const [battery, setBattery] = useState(null);
  const [storagePersisted, setStoragePersisted] = useState(null);
  const [storageEstimate, setStorageEstimate] = useState(null);
  const [idbOk, setIdbOk] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [mediaCaps, setMediaCaps] = useState(null);
  const [securityCtx, setSecurityCtx] = useState(null);

  const { mode, setMode } = useMode();

  // Lightweight FPS estimate (1s window)
  React.useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();

    const tick = (t) => {
      frames++;
      const dt = t - last;
      if (dt >= 1000) {
        setFps(Math.round((frames * 1000) / dt));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  //  Event-loop lag (setTimeout drift)
  React.useEffect(() => {
    let alive = true;
    let t = 0;
    const interval = 300;
    const loop = () => {
      const start = performance.now();
      setTimeout(() => {
        if (!alive) return;
        const end = performance.now();
        const drift = Math.max(0, end - start - interval);
        // Smooth
        setEventLoopLag((prev) => {
          const v = drift;
          if (prev == null) return v;
          return prev * 0.8 + v * 0.2;
        });
        t = window.setTimeout(loop, interval);
      }, interval);
    };
    loop();
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);

  // Long Tasks observer (best-effort; safe and page-scoped)
  React.useEffect(() => {
    try {
      if (!("PerformanceObserver" in window)) return;
      const obs = new PerformanceObserver((list) => {
        const entries = list.getEntries?.() || [];
        if (!entries.length) return;
        const last = entries[entries.length - 1];
        const ms = Number((last.duration ?? 0).toFixed(1));
        setLongTasks((prev) => ({
          count: (prev?.count ?? 0) + entries.length,
          lastMs: ms,
        }));
      });
      // longtask supported in Chromium
      obs.observe({ type: "longtask", buffered: true });
      return () => obs.disconnect();
    } catch {
      // ignore
    }
  }, []);

  // JS heap (Chromium only)
  React.useEffect(() => {
    try {
      const m = performance?.memory;
      if (!m) return;
      const poll = () => {
        setHeap({
          used: m.usedJSHeapSize,
          total: m.totalJSHeapSize,
          limit: m.jsHeapSizeLimit,
        });
      };
      poll();
      const id = setInterval(poll, 1500);
      return () => clearInterval(id);
    } catch {
      // ignore
    }
  }, []);

  // Battery (best-effort)
  React.useEffect(() => {
    let cleanup = null;
    (async () => {
      try {
        if (!navigator.getBattery) return;
        const b = await navigator.getBattery();
        const read = () => {
          setBattery({
            level: Math.round((b.level ?? 0) * 100),
            charging: !!b.charging,
            chargingTime: b.chargingTime,
            dischargingTime: b.dischargingTime,
          });
        };
        read();
        const onChange = () => read();
        b.addEventListener("levelchange", onChange);
        b.addEventListener("chargingchange", onChange);
        b.addEventListener("chargingtimechange", onChange);
        b.addEventListener("dischargingtimechange", onChange);
        cleanup = () => {
          b.removeEventListener("levelchange", onChange);
          b.removeEventListener("chargingchange", onChange);
          b.removeEventListener("chargingtimechange", onChange);
          b.removeEventListener("dischargingtimechange", onChange);
        };
      } catch {
        // ignore
      }
    })();
    return () => cleanup?.();
  }, []);

  // Storage persisted + estimate + IndexedDB health
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (navigator.storage?.persisted) {
          const p = await navigator.storage.persisted();
          if (alive) setStoragePersisted(!!p);
        }
      } catch {
        /* ignore */
      }

      try {
        if (navigator.storage?.estimate) {
          const est = await navigator.storage.estimate();
          if (alive)
            setStorageEstimate({
              quota: est.quota ?? null,
              usage: est.usage ?? null,
            });
        }
      } catch {
        /* ignore */
      }

      try {
        const ok = await new Promise((resolve) => {
          if (!("indexedDB" in window)) return resolve(false);
          const req = indexedDB.open("__nexus_idb_probe__", 1);
          req.onupgradeneeded = () => {
            /* noop */
          };
          req.onsuccess = () => {
            try {
              req.result.close();
              indexedDB.deleteDatabase("__nexus_idb_probe__");
            } catch {
              /* noop */
            }
            resolve(true);
          };
          req.onerror = () => resolve(false);
        });
        if (alive) setIdbOk(ok);
      } catch {
        if (alive) setIdbOk(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Permissions overview (query only; no prompts)
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!navigator.permissions?.query) return;
        const names = [
          "notifications",
          "geolocation",
          "microphone",
          "camera",
          "clipboard-read",
          "clipboard-write",
        ];
        const out = {};
        for (const n of names) {
          try {
            const s = await navigator.permissions.query({ name: n });
            out[n] = s.state;
          } catch {
            out[n] = "unavailable";
          }
        }
        if (alive) setPermissions(out);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Media capability matrix (safe: capability checks only)
  React.useEffect(() => {
    try {
      const video = [
        { label: "H.264 (MP4)", type: 'video/mp4; codecs="avc1.42E01E"' },
        { label: "HEVC (MP4)", type: 'video/mp4; codecs="hvc1"' },
        { label: "VP9 (WebM)", type: 'video/webm; codecs="vp9"' },
        { label: "AV1 (MP4)", type: 'video/mp4; codecs="av01.0.05M.08"' },
      ];
      const audio = [
        { label: "AAC", type: 'audio/mp4; codecs="mp4a.40.2"' },
        { label: "Opus", type: 'audio/ogg; codecs="opus"' },
        { label: "MP3", type: "audio/mpeg" },
        { label: "WAV", type: "audio/wav" },
      ];
      const images = [
        { label: "WebP", type: "image/webp" },
        { label: "AVIF", type: "image/avif" },
      ];
      const can = (t) => {
        try {
          const v = document.createElement("video");
          return !!v.canPlayType?.(t);
        } catch {
          return false;
        }
      };
      const canA = (t) => {
        try {
          const a = document.createElement("audio");
          return !!a.canPlayType?.(t);
        } catch {
          return false;
        }
      };
      setMediaCaps({
        video: video.map((x) => ({ ...x, ok: can(x.type) })),
        audio: audio.map((x) => ({ ...x, ok: canA(x.type) })),
        images: images.map((x) => ({
          ...x,
          ok: (() => {
            try {
              const c = document.createElement("canvas");
              return c.toDataURL(x.type).startsWith(`data:${x.type}`);
            } catch {
              return false;
            }
          })(),
        })),
      });
    } catch {
      // ignore
    }
  }, []);

  // Security context + SW status + protocol
  React.useEffect(() => {
    try {
      const isSecure = window.isSecureContext;
      const proto = window.location?.protocol || "—";
      const coi = !!window.crossOriginIsolated;
      const sw = !!navigator.serviceWorker;
      const controlled = !!navigator.serviceWorker?.controller;
      // nextHopProtocol is per-resource; we probe navigation timing if available
      let nhp = "—";
      try {
        const nav = performance.getEntriesByType?.("navigation")?.[0];
        if (nav?.nextHopProtocol) nhp = nav.nextHopProtocol;
      } catch {
        /* ignore */
      }
      setSecurityCtx({
        isSecure,
        proto,
        coi,
        sw,
        controlled,
        nextHopProtocol: nhp,
      });
    } catch {
      // ignore
    }
  }, []);

  const privacy = useMemo(() => {
    const items = [];
    items.push({ k: "Do Not Track", v: info.dnt });
    items.push({ k: "Cookies", v: info.cookieEnabled });
    items.push({
      k: "Touch Support",
      v: "ontouchstart" in window ? "Likely" : "Unknown/No",
    });
    items.push({
      k: "Storage Access",
      v: bytes == null ? "Blocked/Unavailable" : "Available",
    });
    return items;
  }, [info.dnt, info.cookieEnabled, bytes]);

  const systemContext = useMemo(
    () => ({
      system: info,
      display,
    }),
    [info, display]
  );

  function toast(title, msg) {
    push(title, msg);
  }

  function clearStorage() {
    try {
      localStorage.clear();
      refresh();
      toast("Storage cleared", "Local storage has been wiped for this origin.");
    } catch {
      toast("Storage blocked", "Browser prevented access to localStorage.");
    }
  }

  const onlineTone = online ? "good" : "bad";
  const onlineLabel = online ? "Connected" : "Offline";

  const netType = net.supported
    ? net.effectiveType || "WIFI/ETH"
    : "Not Supported";
  const down = net.supported
    ? net.downlink != null
      ? `~${net.downlink} Mbps`
      : "—"
    : "—";
  const rtt = net.supported ? (net.rtt != null ? `${net.rtt} ms` : "—") : "—";

  const kpi = [
    { label: "Status", val: onlineLabel, tone: onlineTone },
    { label: "FPS", val: fps ? `${fps}` : "—" },
    { label: "Local Storage", val: bytes == null ? "—" : formatBytes(bytes) },
    {
      label: "Latency",
      val: latency == null ? "—" : `${latency.toFixed(2)} ms`,
    },
  ];

  // Build a complete snapshot object for daily/timeline/export
  const snapshot = useMemo(
    () =>
      buildSnapshot({
        info,
        display,
        net,
        online,
        bytes,
        fps,
        latency,
        eventLoopLag,
        longTasks,
        heap,
        battery,
        storagePersisted,
        storageEstimate,
        idbOk,
        permissions,
        mediaCaps,
        securityCtx,
      }),
    [
      info,
      display,
      net,
      online,
      bytes,
      fps,
      latency,
      eventLoopLag,
      longTasks,
      heap,
      battery,
      storagePersisted,
      storageEstimate,
      idbOk,
      permissions,
      mediaCaps,
      securityCtx,
    ]
  );

  // Scores + daily insight + change detection
  const scores = useMemo(() => computeScores(snapshot), [snapshot]);
  const humanSummary = useMemo(
    () => buildHumanSummary(snapshot, scores),
    [snapshot, scores]
  );

  const [lastSaved, setLastSaved] = useState(null);
  const [lastDiff, setLastDiff] = useState(null);

  function onDailySaved(savedSnap, prevSnap) {
    setLastSaved(savedSnap);
    if (prevSnap) {
      setLastDiff(diffSnapshots(prevSnap, savedSnap));
    } else {
      setLastDiff(null);
    }
  }

  function onLatency(ms) {
    setLatency(ms);
    toast("Latency test", `${ms.toFixed(2)} ms round-trip`);
  }

  return (
    <>
      <div className="bgFX" aria-hidden="true" />
      <Navbar />

      {/* Snapshot region for PDF export */}
      <div
        id="snapshot"
        className={`container ${
          mode === "focus" ? "modeFocus" : mode === "audit" ? "modeAudit" : ""
        }`}
      >
        <header className="hero">
          <div className="heroCard">
            <div className="heroTop">
              <div className="brand">
                <div className="logo" aria-hidden="true" />
                <div>
                  <div className="brandName">NEXUS DIAGNOSTICS</div>
                  <div className="small">
                    Real-time browser environment overview
                  </div>
                </div>
              </div>

              <div className="actions" style={{ marginTop: 0 }}>
                {/* Mode toggle (Focus / Default / Audit) */}
                <ModeToggle mode={mode} setMode={setMode} />

                {/* Existing PDF export (upgraded to multipage in file below) */}
                <ExportPDF targetId="snapshot" onToast={toast} />

                {/* Quick exports (JSON + summary + redacted) */}
                <ExportsPanel
                  snapshot={snapshot}
                  summaryText={humanSummary}
                  onToast={toast}
                />

                <button
                  className="btn btnPrimary"
                  onClick={() =>
                    document
                      .getElementById("specs")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Run Diagnostics
                </button>
              </div>
            </div>

            <h1 className="heroH1">
              Analyze your <span className="grad">runtime environment</span>.
            </h1>
            <p className="heroP">
              This console reads supported browser APIs to display hardware,
              display, network, storage, and privacy signals. It updates live
              and degrades gracefully when data is unavailable.
            </p>

            {/* Daily insight (changes per day, but grounded in current signals) */}
            <DailyInsight snapshot={snapshot} scores={scores} />

            <div className="kpiBar" aria-label="Key metrics">
              {kpi.map((k) => (
                <div className="kpi" key={k.label}>
                  <div className="kpiLabel">{k.label}</div>
                  <div
                    className="kpiVal"
                    style={
                      k.tone
                        ? {
                            color: `var(--${
                              k.tone === "good" ? "good" : "bad"
                            })`,
                          }
                        : null
                    }
                  >
                    {k.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Revisit hook — daily snapshot + what changed */}
            <div style={{ marginTop: 14 }} className="grid2">
              <DailySnapshotPanel
                snapshot={snapshot}
                onSaved={onDailySaved}
                onToast={toast}
              />
              <ChangesPanel diff={lastDiff} lastSaved={lastSaved} />
            </div>
          </div>
        </header>

        <main>
          {/* Scores (domain-based, not a single grade) */}
          <section id="scores" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Readiness Overview</h2>
                <p className="sub">
                  Multi-domain scores (explainable, non-judgmental) based on
                  today’s signals.
                </p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>Local-only</span>
              </span>
            </div>

            <ScoresPanel snapshot={snapshot} scores={scores} />
          </section>

          {/* System Specs  */}
          <section id="specs" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Hardware & OS</h2>
                <p className="sub">
                  Device signals exposed by the browser (privacy-capped in many
                  cases).
                </p>
              </div>
              <span className="miniBadge" title="Live connection status">
                <span className={`dot ${online ? "dotGood" : "dotWarn"}`} />
                <span>{onlineLabel}</span>
              </span>
            </div>

            <div className="grid3">
              <Card title="Processor & Platform" badge="SYSTEM">
                <StatRow label="CPU Cores" value={info.cores ?? "Unknown"} />
                <StatRow label="Platform" value={info.platform} />
                <StatRow
                  label="Device Memory"
                  value={
                    info.deviceMemory
                      ? `~${info.deviceMemory} GB`
                      : "Privacy-capped"
                  }
                />
                <StatRow label="Language" value={info.lang} />

                {/* Runtime/health additions */}
                <div className="sep" />
                <StatRow
                  label="Event Loop Lag"
                  value={
                    eventLoopLag == null ? "—" : `${eventLoopLag.toFixed(1)} ms`
                  }
                />
                <StatRow
                  label="Long Tasks"
                  value={
                    longTasks?.count
                      ? `${longTasks.count} (last ${
                          longTasks.lastMs ?? "—"
                        } ms)`
                      : "—"
                  }
                />
              </Card>

              <Card title="Display & Viewport" badge="DISPLAY">
                <StatRow label="Screen Resolution" value={display.resolution} />
                <StatRow label="Viewport" value={display.viewport} />
                <StatRow label="Color Depth" value={display.colorDepth} />
                <StatRow label="Pixel Ratio" value={display.pixelRatio} />

                {/* Input/accessibility signals */}
                <div className="sep" />
                <StatRow
                  label="Reduced Motion"
                  value={snapshot?.a11y?.reducedMotion ?? "—"}
                />
                <StatRow
                  label="Contrast Preference"
                  value={snapshot?.a11y?.contrast ?? "—"}
                />
                <StatRow
                  label="Pointer"
                  value={snapshot?.a11y?.pointer ?? "—"}
                />
              </Card>

              <Card title="Browser Identity" badge="BROWSER">
                <StatRow label="Browser" value={info.browser} />
                <StatRow
                  label="Online"
                  value={onlineLabel}
                  tone={online ? "good" : "warn"}
                />
                <StatRow
                  label="User Agent"
                  value={
                    (info.ua || "").slice(0, 44) +
                    ((info.ua || "").length > 44 ? "…" : "")
                  }
                />
                <StatRow
                  label="UA Length"
                  value={
                    (info.ua || "").length
                      ? `${(info.ua || "").length} chars`
                      : "—"
                  }
                />

                {/* Heap (when supported) */}
                <div className="sep" />
                <StatRow
                  label="JS Heap Used"
                  value={heap?.used != null ? formatBytes(heap.used) : "—"}
                />
                <StatRow
                  label="JS Heap Limit"
                  value={heap?.limit != null ? formatBytes(heap.limit) : "—"}
                />
              </Card>
            </div>
          </section>

          {/* Network */}
          <section id="network" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Network Analysis</h2>
                <p className="sub">
                  Network Information API varies by browser and may be
                  unavailable.
                </p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>{net.supported ? "API Detected" : "API Missing"}</span>
              </span>
            </div>

            <div className="grid2">
              <Card title="Connection Snapshot" badge="NET">
                <StatRow label="Effective Type" value={netType} />
                <StatRow label="Downlink (Reported)" value={down} />
                <StatRow label="RTT (Reported)" value={rtt} />
                <StatRow
                  label="Data Saver"
                  value={
                    net.supported
                      ? net.saveData
                        ? "Enabled"
                        : "Disabled"
                      : "—"
                  }
                />

                {/* protocol */}
                <div className="sep" />
                <StatRow
                  label="Next Hop Protocol"
                  value={securityCtx?.nextHopProtocol ?? "—"}
                />

                <div style={{ marginTop: 12 }}>
                  <PingTest onResult={onLatency} />
                </div>
              </Card>

              <Card title="Stability Notes" badge="GUIDE">
                <div className="small">
                  <p style={{ margin: "0 0 10px" }}>
                    Some browsers intentionally reduce precision for
                    privacy/security. When values look missing or
                    overly-rounded, that's expected.
                  </p>
                  <p style={{ margin: "0 0 10px" }}>
                    For the cleanest view: run in a modern Chromium-based
                    browser, disable aggressive tracking protection, and allow
                    this page to store local data.
                  </p>
                  <p style={{ margin: 0 }}>
                    Tip: Export a PDF snapshot before sharing results with
                    someone else.
                  </p>
                </div>
              </Card>
            </div>

            {/*  Media capability panel (safe capability checks) */}
            <div className="grid2" style={{ marginTop: 16 }}>
              <Card title="Media & Codec Support" badge="MEDIA">
                <div className="small">
                  These are capability checks only (no device enumeration).
                </div>
                <div className="sep" />
                <div className="grid2">
                  <div>
                    <div
                      className="small"
                      style={{ fontWeight: 900, marginBottom: 8 }}
                    >
                      Video
                    </div>
                    {(mediaCaps?.video ?? []).map((v) => (
                      <div className="row" key={v.label}>
                        <div className="label">{v.label}</div>
                        <div
                          className="value"
                          style={{
                            color: v.ok ? "var(--good)" : "var(--warn)",
                          }}
                        >
                          {v.ok ? "Supported" : "Unknown/No"}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div
                      className="small"
                      style={{ fontWeight: 900, marginBottom: 8 }}
                    >
                      Audio
                    </div>
                    {(mediaCaps?.audio ?? []).map((a) => (
                      <div className="row" key={a.label}>
                        <div className="label">{a.label}</div>
                        <div
                          className="value"
                          style={{
                            color: a.ok ? "var(--good)" : "var(--warn)",
                          }}
                        >
                          {a.ok ? "Supported" : "Unknown/No"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="sep" />
                <div>
                  <div
                    className="small"
                    style={{ fontWeight: 900, marginBottom: 8 }}
                  >
                    Images
                  </div>
                  {(mediaCaps?.images ?? []).map((i) => (
                    <div className="row" key={i.label}>
                      <div className="label">{i.label}</div>
                      <div
                        className="value"
                        style={{ color: i.ok ? "var(--good)" : "var(--warn)" }}
                      >
                        {i.ok ? "Supported" : "Unknown/No"}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Power & Battery" badge="POWER">
                <StatRow
                  label="Battery API"
                  value={battery ? "Available" : "Not supported"}
                />
                <StatRow
                  label="Level"
                  value={battery ? `${battery.level}%` : "—"}
                />
                <StatRow
                  label="Charging"
                  value={battery ? (battery.charging ? "Yes" : "No") : "—"}
                />
                <StatRow
                  label="Discharge Time"
                  value={
                    battery &&
                    !battery.charging &&
                    Number.isFinite(battery.dischargingTime)
                      ? `${Math.round(battery.dischargingTime / 60)} min`
                      : "—"
                  }
                />
                <div className="sep" />
                <div className="small">
                  Battery data is restricted in many browsers. We only read what
                  the browser exposes (no permissions requested).
                </div>
              </Card>
            </div>
          </section>

          {/* Tools  */}
          <section id="tools" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Utilities</h2>
                <p className="sub">
                  Small tools that feel like a game console: clean, fast, and
                  reliable.
                </p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>{time}</span>
              </span>
            </div>

            <div className="grid3">
              <Card title="Local Storage" badge="STORAGE">
                <StatRow
                  label="Used (localStorage)"
                  value={
                    bytes == null ? "Blocked/Unavailable" : formatBytes(bytes)
                  }
                />
                <StatRow label="Estimated Limit" value="Varies by browser" />

                {/*  Storage estimate + persistence + idb */}
                <div className="sep" />
                <StatRow
                  label="Storage Usage (estimate)"
                  value={
                    storageEstimate?.usage != null
                      ? formatBytes(storageEstimate.usage)
                      : "—"
                  }
                />
                <StatRow
                  label="Storage Quota (estimate)"
                  value={
                    storageEstimate?.quota != null
                      ? formatBytes(storageEstimate.quota)
                      : "—"
                  }
                />
                <StatRow
                  label="Persisted Storage"
                  value={
                    storagePersisted == null
                      ? "—"
                      : storagePersisted
                      ? "Yes"
                      : "No"
                  }
                />
                <StatRow
                  label="IndexedDB Health"
                  value={idbOk == null ? "—" : idbOk ? "OK" : "Blocked/Fail"}
                  tone={idbOk ? "good" : idbOk === false ? "warn" : undefined}
                />

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 12,
                  }}
                >
                  <button
                    className="btn btnGhost"
                    onClick={() =>
                      toast(
                        "Snapshot",
                        `Storage: ${bytes == null ? "—" : formatBytes(bytes)}`
                      )
                    }
                  >
                    Quick Toast
                  </button>
                  <button className="btn" onClick={clearStorage}>
                    Clear Storage
                  </button>
                </div>
              </Card>

              <Card title="System Time" badge="CLOCK">
                <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontWeight: 900,
                      fontSize: "2rem",
                      color: "rgba(234,242,255,.92)",
                    }}
                  >
                    {time}
                  </div>
                  <div className="small" style={{ marginTop: 6 }}>
                    {date}
                  </div>
                  <div className="sep" />
                  <div className="small">
                    FPS (est.):{" "}
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        color: "var(--neon)",
                        fontWeight: 900,
                      }}
                    >
                      {fps ?? "—"}
                    </span>
                  </div>
                  <div className="small">
                    Event-loop lag:{" "}
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        color: "var(--neon)",
                        fontWeight: 900,
                      }}
                    >
                      {eventLoopLag == null
                        ? "—"
                        : `${eventLoopLag.toFixed(1)} ms`}
                    </span>
                  </div>
                </div>
              </Card>

              <Card title="Command Line" badge="CLI">
                <Terminal
                  contextInfo={{
                    ...systemContext,
                    snapshot,
                    scores,
                    summaryText: humanSummary,
                  }}
                  onToast={(t, m) => toast(t, m)}
                />
              </Card>
            </div>

            {/* Notifications (opt-in only) + “console mode” explanation */}
            <div className="grid2" style={{ marginTop: 16 }}>
              <NotificationsPanel snapshot={snapshot} onToast={toast} />
              <Card title="Console Modes" badge="UX">
                <div className="small">
                  <p style={{ margin: "0 0 10px" }}>
                    <b>Focus</b> hides extra explanation and reduces motion.{" "}
                    <b>Audit</b> expands details for troubleshooting. Your mode
                    is saved locally on this device.
                  </p>
                  <p style={{ margin: 0 }}>
                    Tip: Use Focus mode on mobile or during streaming; use Audit
                    mode when diagnosing issues.
                  </p>
                </div>
              </Card>
            </div>

            {/* Timeline */}
            <div style={{ marginTop: 16 }}>
              <TimelinePanel />
            </div>
          </section>

          {/* Privacy */}
          <section id="privacy" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Privacy & Security</h2>
                <p className="sub">
                  A clear view of what the browser reveals and what it
                  intentionally hides.
                </p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>Client-Side Only</span>
              </span>
            </div>

            <div className="grid2">
              <Card title="Signals" badge="PRIVACY">
                {privacy.map((p) => (
                  <StatRow key={p.k} label={p.k} value={p.v} />
                ))}

                {/*  Permissions (query-only) */}
                <div className="sep" />
                <div
                  className="small"
                  style={{ fontWeight: 900, marginBottom: 8 }}
                >
                  Permissions (query-only)
                </div>
                {permissions ? (
                  Object.entries(permissions).map(([k, v]) => (
                    <StatRow key={k} label={k} value={v} />
                  ))
                ) : (
                  <StatRow label="Permissions API" value="Not available" />
                )}
              </Card>

              <Card title="Data Policy" badge="LOCAL">
                <div className="small">
                  <p style={{ margin: "0 0 10px" }}>
                    NEXUS runs entirely in your browser. It does not send your
                    diagnostics to a server. Any stored data is limited to your
                    browser&apos;s local storage for this origin.
                  </p>
                  <p style={{ margin: "0 0 10px" }}>
                    If you deploy this, consider adding your own analytics only
                    if you have a clear privacy policy.
                  </p>
                  <p style={{ margin: 0 }}>
                    Exported PDFs are generated on-device and downloaded
                    directly—no upload occurs.
                  </p>
                </div>

                {/* Security context signals */}
                <div className="sep" />
                <StatRow
                  label="Secure Context"
                  value={securityCtx?.isSecure ? "Yes" : "No"}
                  tone={securityCtx?.isSecure ? "good" : "warn"}
                />
                <StatRow label="Protocol" value={securityCtx?.proto ?? "—"} />
                <StatRow
                  label="Cross-Origin Isolated"
                  value={securityCtx?.coi ? "Yes" : "No"}
                />
                <StatRow
                  label="Service Worker Support"
                  value={securityCtx?.sw ? "Yes" : "No"}
                />
                <StatRow
                  label="SW Controller"
                  value={securityCtx?.controlled ? "Active" : "None"}
                />
              </Card>
            </div>

            {/* Trust block (retention via respect) */}
            <div style={{ marginTop: 16 }}>
              <TrustBlock />
            </div>

            <footer className="footer">
              <div className="sep" />
              <div className="small">
                NEXUS Diagnostics — built with Vite + React. Neon-green HUD
                styling for PC, tablet, and mobile.
              </div>
            </footer>
          </section>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
