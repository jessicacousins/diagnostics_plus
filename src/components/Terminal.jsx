// import React, { useEffect, useMemo, useRef, useState } from 'react'
// import { safeMathEval } from '../utils/format.js'

// function line(type, text){
//   return { id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, type, text }
// }

// export default function Terminal({ contextInfo, onToast }){
//   const [lines, setLines] = useState(() => ([
//     line('dim', "Welcome to NEXUS CLI. Type 'help'."),
//   ]))
//   const [input, setInput] = useState('')
//   const boxRef = useRef(null)
//   const inputRef = useRef(null)

//   const cmds = useMemo(() => ([
//     { name:'help', desc:'List commands' },
//     { name:'clear', desc:'Clear the terminal' },
//     { name:'date', desc:'Print local date/time' },
//     { name:'info', desc:'System summary' },
//     { name:'browser', desc:'User agent string' },
//     { name:'copy ua', desc:'Copy user agent to clipboard' },
//     { name:'summary', desc:'One-line diagnostic summary' },
//     { name:'copy json', desc:'Copy full diagnostics JSON' },
//     { name:'calc <expr>', desc:'Calculator (safe subset)' },
//   ]), [])

//   useEffect(() => {
//     boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior:'smooth' })
//   }, [lines])

//   function add(type, text){
//     setLines(prev => [...prev, line(type, text)].slice(-120))
//   }

//   async function run(raw){
//     const cmd = raw.trim()
//     if (!cmd) return
//     add('cmd', `➜ ${cmd}`)

//     const lc = cmd.toLowerCase()

//     if (lc === 'help'){
//       add('dim', 'Commands:')
//       cmds.forEach(c => add('dim', `• ${c.name} — ${c.desc}`))
//       return
//     }

//     if (lc === 'clear'){
//       setLines([line('dim', "NEXUS CLI cleared. Type 'help'.")])
//       return
//     }

//     if (lc === 'date'){
//       add('out', new Date().toString())
//       return
//     }

//     if (lc === 'info'){
//       const s = contextInfo?.system?.info || {}
//       add('out', `OS: ${s.platform ?? '—'}`)
//       add('out', `Browser: ${s.browser ?? '—'}`)
//       add('out', `Cores: ${s.cores ?? '—'}`)
//       add('out', `Language: ${s.lang ?? '—'}`)
//       return
//     }

//     if (lc === 'browser'){
//       const ua = contextInfo?.system?.info?.ua ?? navigator.userAgent
//       add('out', contextInfo?.redacted ? 'Redacted (toggle in header)' : ua)
//       return
//     }

//     if (lc === 'copy ua'){
//       try{
//         if (contextInfo?.redacted){
//           onToast?.('Redacted', 'Turn off Redacted mode to copy UA.')
//           return
//         }
//         const ua = contextInfo?.system?.info?.ua ?? navigator.userAgent
//         await navigator.clipboard.writeText(ua)
//         onToast?.('Copied', 'User agent copied to clipboard.')
//       }catch{
//         onToast?.('Clipboard blocked', 'Browser prevented clipboard access.')
//       }
//       return
//     }

//     if (lc === 'summary'){
//       const s = contextInfo?.system?.info || {}
//       const d = contextInfo?.system?.display || {}
//       const n = contextInfo?.network || {}
//       const r = contextInfo?.runtime || {}
//       const sec = contextInfo?.security || {}
//       const line = `Browser ${s.browser ?? '—'} | ${d.resolution ?? '—'} | cores ${s.cores ?? '—'} | net ${n.type ?? '—'} | fps ${r.fps ?? '—'} | secure ${sec.isSecureContext ? 'yes' : 'no'}`
//       add('out', line)
//       return
//     }

//     if (lc === 'copy json'){
//       try{
//         const text = JSON.stringify(contextInfo, null, 2)
//         await navigator.clipboard.writeText(text)
//         onToast?.('Copied', 'Diagnostics JSON copied to clipboard.')
//       }catch{
//         onToast?.('Clipboard blocked', 'Browser prevented clipboard access.')
//       }
//       return
//     }

//     if (lc.startsWith('calc ')){
//       const expr = cmd.slice(5)
//       try{
//         const v = safeMathEval(expr)
//         add('out', `= ${v}`)
//         return
//       }catch{
//         add('out', 'Math error or unsupported expression.')
//         return
//       }
//     }

//     add('out', `Command not found: ${cmd}`)
//   }

//   function onKeyDown(e){
//     if (e.key === 'Enter'){
//       const val = input
//       setInput('')
//       run(val)
//     }
//     if (e.key === 'Escape'){
//       setInput('')
//       inputRef.current?.blur()
//     }
//   }

//   return (
//     <div className="terminal" ref={boxRef} onClick={() => inputRef.current?.focus()}>
//       {lines.map(l => (
//         <p
//           className={l.type === 'dim' ? 'termLine termLineDim' : 'termLine'}
//           key={l.id}
//         >
//           {l.text}
//         </p>
//       ))}

//       <div className="termPromptRow">
//         <span className="prompt">➜</span>
//         <input
//           ref={inputRef}
//           className="termInput"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={onKeyDown}
//           spellCheck={false}
//           autoCorrect="off"
//           autoCapitalize="none"
//           placeholder="help | info | calc 2*(3+4)"
//           aria-label="Terminal input"
//         />
//       </div>
//     </div>
//   )
// }
import React, { useEffect, useMemo, useRef, useState } from "react";
import { safeMathEval } from "../utils/format.js";
import {
  saveDailySnapshot,
  listSnapshots,
  getLastSnapshots,
  diffSnapshots,
} from "../utils/snapshot.js";

function line(type, text) {
  return {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type,
    text,
  };
}

export default function Terminal({ contextInfo, onToast }) {
  const [lines, setLines] = useState(() => [
    line("dim", "Welcome to NEXUS CLI. Type 'help'."),
  ]);
  const [input, setInput] = useState("");
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const cmds = useMemo(
    () => [
      { name: "help", desc: "List commands" },
      { name: "clear", desc: "Clear the terminal" },
      { name: "date", desc: "Print local date/time" },
      { name: "info", desc: "System summary" },
      { name: "browser", desc: "User agent string" },
      { name: "copy ua", desc: "Copy user agent to clipboard" },
      { name: "calc <expr>", desc: "Calculator (safe subset)" },

      // NEW
      { name: "snapshot save", desc: "Save today’s snapshot (local)" },
      { name: "snapshot list", desc: "List saved snapshots" },
      { name: "snapshot diff", desc: "Show changes vs previous snapshot" },
      { name: "export json", desc: "Download JSON snapshot" },
      { name: "copy summary", desc: "Copy human-readable summary" },
      { name: "mode focus|default|audit", desc: "Switch console mode" },
    ],
    []
  );

  useEffect(() => {
    boxRef.current?.scrollTo({
      top: boxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines]);

  function add(type, text) {
    setLines((prev) => [...prev, line(type, text)].slice(-140));
  }

  function downloadText(filename, text, type = "application/json") {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    add("cmd", `➜ ${cmd}`);

    const lc = cmd.toLowerCase();
    const snap = contextInfo?.snapshot;
    const summaryText = contextInfo?.summaryText || "";
    const setMode = contextInfo?.setMode;

    if (lc === "help") {
      add("dim", "Commands:");
      cmds.forEach((c) => add("dim", `• ${c.name} — ${c.desc}`));
      return;
    }

    if (lc === "clear") {
      setLines([line("dim", "NEXUS CLI cleared. Type 'help'.")]);
      return;
    }

    if (lc === "date") {
      add("out", new Date().toString());
      return;
    }

    if (lc === "info") {
      const s = contextInfo?.system;
      add("out", `OS: ${s?.platform ?? "—"}`);
      add("out", `Browser: ${s?.browser ?? "—"}`);
      add("out", `Cores: ${s?.cores ?? "—"}`);
      add("out", `Language: ${s?.lang ?? "—"}`);
      return;
    }

    if (lc === "browser") {
      add("out", contextInfo?.system?.ua ?? navigator.userAgent);
      return;
    }

    if (lc === "copy ua") {
      try {
        await navigator.clipboard.writeText(
          contextInfo?.system?.ua ?? navigator.userAgent
        );
        onToast?.("Copied", "User agent copied to clipboard.");
      } catch {
        onToast?.("Clipboard blocked", "Browser prevented clipboard access.");
      }
      return;
    }

    if (lc.startsWith("calc ")) {
      const expr = cmd.slice(5);
      try {
        const v = safeMathEval(expr);
        add("out", `= ${v}`);
        return;
      } catch {
        add("out", "Math error or unsupported expression.");
        return;
      }
    }

    // NEW: snapshot commands
    if (lc === "snapshot save") {
      if (!snap) {
        add("out", "Snapshot not ready yet.");
        return;
      }
      const { saved, previous } = saveDailySnapshot(snap);
      onToast?.("Daily saved", `Saved: ${saved.meta.label}`);
      add("out", `Saved snapshot: ${saved.meta.label}`);
      if (previous) {
        const d = diffSnapshots(previous, saved);
        add("dim", `Changes vs previous: ${d.summary}`);
      } else {
        add("dim", "No previous snapshot found.");
      }
      return;
    }

    if (lc === "snapshot list") {
      const list = listSnapshots();
      if (!list.length) {
        add("out", "No saved snapshots yet. Use: snapshot save");
        return;
      }
      add("dim", `Saved snapshots (${list.length}):`);
      list
        .slice(0, 20)
        .forEach((s) =>
          add(
            "out",
            `• ${s.meta.label} — ${new Date(s.meta.ts).toLocaleString()}`
          )
        );
      return;
    }

    if (lc === "snapshot diff") {
      const [prev, cur] = getLastSnapshots(2);
      if (!cur) {
        add("out", "No snapshots saved yet.");
        return;
      }
      if (!prev) {
        add("out", "Only one snapshot exists. Save another tomorrow.");
        return;
      }
      const d = diffSnapshots(prev, cur);
      add("dim", d.summary);
      d.items
        .slice(0, 18)
        .forEach((x) => add("out", `• ${x.label}: ${x.from} → ${x.to}`));
      return;
    }

    if (lc === "export json") {
      if (!snap) {
        add("out", "Snapshot not ready yet.");
        return;
      }
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      downloadText(`nexus-snapshot-${ts}.json`, JSON.stringify(snap, null, 2));
      onToast?.("Export ready", "Downloaded snapshot JSON.");
      return;
    }

    if (lc === "copy summary") {
      try {
        await navigator.clipboard.writeText(summaryText || "—");
        onToast?.("Copied", "Summary copied to clipboard.");
      } catch {
        onToast?.("Clipboard blocked", "Browser prevented clipboard access.");
      }
      return;
    }

    if (lc.startsWith("mode ")) {
      const v = lc.slice(5).trim();
      if (!["focus", "default", "audit"].includes(v)) {
        add("out", "Usage: mode focus | mode default | mode audit");
        return;
      }
      // optional: if App passes setMode in context
      if (typeof setMode === "function") {
        setMode(v);
      } else {
        try {
          localStorage.setItem("nexus_mode", v);
        } catch {
          /* ignore */
        }
      }
      onToast?.("Mode", `Switched to ${v}`);
      add("out", `Mode set: ${v}`);
      return;
    }

    add("out", `Command not found: ${cmd}`);
  }

  function onKeyDown(e) {
    if (e.key === "Enter") {
      const val = input;
      setInput("");
      run(val);
    }
    if (e.key === "Escape") {
      setInput("");
      inputRef.current?.blur();
    }
  }

  return (
    <div
      className="terminal"
      ref={boxRef}
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((l) => (
        <p
          className={l.type === "dim" ? "termLine termLineDim" : "termLine"}
          key={l.id}
        >
          {l.text}
        </p>
      ))}

      <div className="termPromptRow">
        <span className="prompt">➜</span>
        <input
          ref={inputRef}
          className="termInput"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="none"
          placeholder="help | snapshot save | snapshot diff | export json"
          aria-label="Terminal input"
        />
      </div>
    </div>
  );
}
