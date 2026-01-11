import { useEffect, useState } from "react";

export function useMode() {
  const [mode, setModeState] = useState(() => {
    try {
      return localStorage.getItem("nexus_mode") || "default";
    } catch {
      return "default";
    }
  });

  function setMode(v) {
    setModeState(v);
    try {
      localStorage.setItem("nexus_mode", v);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    // keep valid
    if (!["focus", "default", "audit"].includes(mode)) setMode("default");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mode, setMode };
}
