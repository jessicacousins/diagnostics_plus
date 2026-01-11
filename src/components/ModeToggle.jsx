import React from "react";

export default function ModeToggle({ mode, setMode }) {
  return (
    <div className="seg">
      <button
        className={`segBtn ${mode === "focus" ? "segOn" : ""}`}
        onClick={() => setMode("focus")}
      >
        Focus
      </button>
      <button
        className={`segBtn ${mode === "default" ? "segOn" : ""}`}
        onClick={() => setMode("default")}
      >
        Default
      </button>
      <button
        className={`segBtn ${mode === "audit" ? "segOn" : ""}`}
        onClick={() => setMode("audit")}
      >
        Audit
      </button>
    </div>
  );
}
