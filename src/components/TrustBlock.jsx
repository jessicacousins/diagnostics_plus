import React from "react";

export default function TrustBlock() {
  return (
    <section className="card">
      <div className="cardTitle">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>Trust & Transparency</span>
          <span className="pill">NO TRACKING</span>
        </div>
      </div>

      <div className="grid2">
        <div className="small">
          <p style={{ margin: "0 0 10px" }}>
            <b>What NEXUS does</b>
          </p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Reads supported browser APIs to show diagnostics</li>
            <li>Saves snapshots locally only (if you choose)</li>
            <li>Exports reports on-device (PDF/JSON/TXT)</li>
          </ul>
        </div>

        <div className="small">
          <p style={{ margin: "0 0 10px" }}>
            <b>What NEXUS does NOT do</b>
          </p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>No accounts, no logins</li>
            <li>No uploads, no server logging</li>
            <li>
              No fingerprinting (no canvas/audio hashing, no font enumeration)
            </li>
            <li>No IP discovery or cross-origin probing</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
