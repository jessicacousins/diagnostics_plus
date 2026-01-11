import { formatBytes } from "./format.js";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function todayKey() {
  const d = new Date();
  return d.toDateString();
}

function matchMediaVal(q) {
  try {
    return window.matchMedia(q).matches;
  } catch {
    return false;
  }
}

export function buildSnapshot(payload) {
  const {
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
  } = payload;

  const a11y = {
    reducedMotion: matchMediaVal("(prefers-reduced-motion: reduce)")
      ? "Reduce"
      : "No preference",
    contrast: matchMediaVal("(prefers-contrast: more)")
      ? "More"
      : matchMediaVal("(prefers-contrast: less)")
      ? "Less"
      : "No preference",
    forcedColors: matchMediaVal("(forced-colors: active)") ? "Active" : "No",
    hover: matchMediaVal("(hover: hover)") ? "Hover" : "No hover",
    pointer: matchMediaVal("(pointer: fine)")
      ? "Fine"
      : matchMediaVal("(pointer: coarse)")
      ? "Coarse"
      : "Unknown",
  };

  return {
    meta: {
      id: uid(),
      ts: Date.now(),
      day: todayKey(),
      label: new Date().toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    },

    online: !!online,

    system: {
      cores: info?.cores ?? null,
      platform: info?.platform ?? "—",
      browser: info?.browser ?? "—",
      lang: info?.lang ?? "—",
      deviceMemoryGB: info?.deviceMemory ?? null,
      dnt: info?.dnt ?? "Unknown",
      cookies: info?.cookieEnabled ?? "Unknown",
      ua: info?.ua ?? "",
    },

    display: {
      resolution: display?.resolution ?? "—",
      viewport: display?.viewport ?? "—",
      colorDepth: display?.colorDepth ?? "—",
      pixelRatio: display?.pixelRatio ?? "—",
    },

    net: {
      supported: !!net?.supported,
      effectiveType: net?.effectiveType ?? null,
      downlink: net?.downlink ?? null,
      rtt: net?.rtt ?? null,
      saveData: !!net?.saveData,
    },

    perf: {
      fps: fps ?? null,
      latencyMs: latency ?? null,
      eventLoopLagMs: eventLoopLag ?? null,
      longTasks: {
        count: longTasks?.count ?? 0,
        lastMs: longTasks?.lastMs ?? null,
      },
      heap: heap
        ? { used: heap.used, total: heap.total, limit: heap.limit }
        : null,
    },

    battery: battery ? { ...battery } : null,

    storage: {
      localStorageBytes: bytes ?? null,
      localStorageHuman: bytes == null ? "—" : formatBytes(bytes),
      persisted: storagePersisted ?? null,
      estimate: storageEstimate ?? null,
      indexedDBOk: idbOk ?? null,
    },

    permissions: permissions ?? null,
    media: mediaCaps ?? null,
    security: securityCtx ?? null,
    a11y,
  };
}

const STORE_KEY = "nexus_snapshots";

export function listSnapshots() {
  try {
    const arr = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return Array.isArray(arr) ? arr.slice().reverse() : [];
  } catch {
    return [];
  }
}

export function getLastSnapshots(n = 1) {
  const list = listSnapshots();
  return list.slice(0, n).reverse();
}

export function saveDailySnapshot(snapshot) {
  const saved = JSON.parse(JSON.stringify(snapshot));
  // stable meta id for storage
  saved.meta = { ...saved.meta, id: uid(), ts: Date.now(), day: todayKey() };
  saved.meta.label = new Date(saved.meta.ts).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  let arr = [];
  try {
    arr = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    if (!Array.isArray(arr)) arr = [];
  } catch {
    arr = [];
  }

  const prev = arr.length ? arr[arr.length - 1] : null;

  // replace if same day exists
  const day = saved.meta.day;
  arr = arr.filter((x) => x?.meta?.day !== day);
  arr.push(saved);

  // cap at 60 (2 months)
  if (arr.length > 60) arr = arr.slice(arr.length - 60);

  localStorage.setItem(STORE_KEY, JSON.stringify(arr));
  return { saved, previous: prev };
}

export function redactSnapshot(s) {
  const x = JSON.parse(JSON.stringify(s));
  if (x?.system?.ua) x.system.ua = "[redacted]";
  return x;
}

function pick(v) {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return `${v}`;
  return `${v}`;
}

export function diffSnapshots(a, b) {
  const items = [];

  function add(key, label, from, to) {
    if (from === to) return;
    items.push({ key, label, from, to });
  }

  add("online", "Online", pick(a?.online), pick(b?.online));
  add(
    "net.type",
    "Network Type",
    pick(a?.net?.effectiveType ?? "—"),
    pick(b?.net?.effectiveType ?? "—")
  );
  add("net.rtt", "RTT", pick(a?.net?.rtt ?? "—"), pick(b?.net?.rtt ?? "—"));
  add("perf.fps", "FPS", pick(a?.perf?.fps ?? "—"), pick(b?.perf?.fps ?? "—"));
  add(
    "perf.lag",
    "Event Loop Lag",
    pick(a?.perf?.eventLoopLagMs ?? "—"),
    pick(b?.perf?.eventLoopLagMs ?? "—")
  );
  add(
    "storage.ls",
    "localStorage Used",
    pick(a?.storage?.localStorageHuman ?? "—"),
    pick(b?.storage?.localStorageHuman ?? "—")
  );
  add(
    "security.secure",
    "Secure Context",
    pick(a?.security?.isSecure ?? "—"),
    pick(b?.security?.isSecure ?? "—")
  );
  add(
    "a11y.motion",
    "Reduced Motion",
    pick(a?.a11y?.reducedMotion ?? "—"),
    pick(b?.a11y?.reducedMotion ?? "—")
  );

  const summary = items.length
    ? `${items.length} change${
        items.length === 1 ? "" : "s"
      } since last snapshot`
    : "No changes detected since last snapshot";

  return { summary, items };
}
