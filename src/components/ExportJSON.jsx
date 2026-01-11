import React, { useState } from 'react'

function downloadText(filename, text, mime='application/json'){
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2500)
}

export default function ExportJSON({ diagnostics, redacted, onToast }){
  const [busy, setBusy] = useState(false)

  async function go(){
    if (busy) return
    setBusy(true)
    try{
      const ts = new Date().toISOString().replace(/[:.]/g,'-')
      const payload = {
        exportedAt: new Date().toISOString(),
        redacted: !!redacted,
        diagnostics
      }
      downloadText(`nexus-snapshot-${ts}.json`, JSON.stringify(payload, null, 2))
      onToast?.('Export ready', 'Downloaded diagnostics snapshot (JSON).')
    }catch{
      onToast?.('Export failed', 'Unable to generate JSON export in this browser.')
    }finally{
      setBusy(false)
    }
  }

  return (
    <button className="btn" onClick={go} disabled={busy}>
      {busy ? 'Preparing…' : 'Export Snapshot (JSON)'}
    </button>
  )
}
