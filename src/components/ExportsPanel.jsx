import React, { useState } from "react";
import { redactSnapshot } from "../utils/snapshot.js";

function download(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportsPanel({ snapshot, summaryText, onToast }) {
  const [busy, setBusy] = useState(false);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText || "");
      onToast?.("Copied", "Human-readable summary copied to clipboard.");
    } catch {
      onToast?.("Clipboard blocked", "Browser prevented clipboard access.");
    }
  }

  function exportJSON(redacted) {
    if (!snapshot) return;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const data = redacted ? redactSnapshot(snapshot) : snapshot;
    download(
      `nexus-snapshot-${redacted ? "redacted-" : ""}${ts}.json`,
      JSON.stringify(data, null, 2)
    );
    onToast?.(
      "Export ready",
      `Downloaded ${redacted ? "redacted " : ""}JSON snapshot.`
    );
  }

  function exportSupportTxt() {
    if (!snapshot) return;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const text = summaryText || "—";
    download(`nexus-support-summary-${ts}.txt`, text, "text/plain");
    onToast?.("Export ready", "Downloaded support summary (.txt).");
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}
    >
      <button className="btn btnGhost" onClick={copySummary} disabled={busy}>
        Copy Summary
      </button>
      <button
        className="btn btnGhost"
        onClick={() => exportSupportTxt()}
        disabled={!snapshot}
      >
        Export Support TXT
      </button>
      <button
        className="btn btnGhost"
        onClick={() => exportJSON(false)}
        disabled={!snapshot}
      >
        Export JSON
      </button>
      <button
        className="btn"
        onClick={() => exportJSON(true)}
        disabled={!snapshot}
      >
        Export Redacted JSON
      </button>
    </div>
  );
}
