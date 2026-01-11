import React, { useState } from 'react'

export default function PingTest({ onResult }){
  const [busy, setBusy] = useState(false)
  const [ms, setMs] = useState(null)

  async function run(){
    if (busy) return
    setBusy(true)
    setMs(null)
    const start = performance.now()
    try{
      // HEAD request to current origin, cache-busted.
      await fetch(`${window.location.href.split('#')[0]}?ping=${Date.now()}`, { method:'HEAD', cache:'no-store' })
      const end = performance.now()
      const dur = Math.max(0, end - start)
      const fixed = Number(dur.toFixed(2))
      setMs(fixed)
      onResult?.(fixed)
    }catch{
      setMs('Error')
    }finally{
      setBusy(false)
    }
  }

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
      <button className="btn btnPrimary" onClick={run} disabled={busy} aria-disabled={busy}>
        {busy ? 'Pinging…' : 'Run Test'}
      </button>
      <div className="miniBadge" style={{justifyContent:'space-between', minWidth: 180}}>
        <span>Latency</span>
        <span style={{fontFamily:'var(--mono)', fontWeight:900, color:'var(--neon)'}}>
          {ms == null ? 'Ready' : (ms === 'Error' ? 'Error' : `${ms} ms`)}
        </span>
      </div>
    </div>
  )
}
