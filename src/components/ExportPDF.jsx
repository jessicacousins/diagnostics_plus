import React, { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ExportPDF({ targetId, onToast }) {
  const [busy, setBusy] = useState(false);

  async function exportNow() {
    if (busy) return;
    setBusy(true);
    try {
      const el = document.getElementById(targetId);
      if (!el) {
        onToast?.("Export failed", "Snapshot region not found.");
        return;
      }

      const canvas = await html2canvas(el, {
        backgroundColor: "#070A10",
        scale: window.devicePixelRatio > 1 ? 2 : 1,
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const imgW = pageW;
      const imgH = canvas.height * (pageW / canvas.width);

      let remaining = imgH;
      let y = 0;
      let page = 0;

      while (remaining > 0) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, y, imgW, imgH, undefined, "FAST");
        remaining -= pageH;
        y -= pageH;
        page++;

        if (page > 30) break;
      }

      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      pdf.save(`nexus-snapshot-${ts}.pdf`);
      onToast?.(
        "Export ready",
        "Downloaded dashboard snapshot as multi-page PDF."
      );
    } catch (e) {
      onToast?.(
        "Export failed",
        "Browser blocked capture or ran out of memory."
      );
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btnGhost" onClick={exportNow} disabled={busy}>
      {busy ? "Exporting…" : "Export Snapshot (PDF)"}
    </button>
  );
}
