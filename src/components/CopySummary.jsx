import React, { useState } from 'react'

function fmtTime(sec){
  if (sec == null) return '—'
  if (!Number.isFinite(sec)) return '—'
  if (sec === Infinity) return '∞'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function buildSummary(d){
  const s = d?.system?.info || {}
  const disp = d?.system?.display || {}
  const net = d?.network || {}
  const perf = d?.performance || {}
  const bat = d?.battery || {}
  const a11y = d?.a11y || {}
  const sec = d?.security || {}
  const sess = d?.session || {}
  const storage = d?.storageHealth || {}

  const lines = []
  lines.push('NEXUS Diagnostics Snapshot')
  lines.push(`Generated: ${new Date().toString()}`)
  lines.push('')
  lines.push('SYSTEM')
  lines.push(`Browser: ${s.browser ?? '—'} | Platform: ${s.platform ?? '—'} | Cores: ${s.cores ?? '—'} | Lang: ${s.lang ?? '—'}`)
  lines.push(`Display: ${disp.resolution ?? '—'} | Viewport: ${disp.viewport ?? '—'} | DPR: ${disp.pixelRatio ?? '—'}`)
  lines.push(`DNT: ${s.dnt ?? '—'} | Cookies: ${s.cookieEnabled ?? '—'}`)
  lines.push('')
  lines.push('NETWORK')
  lines.push(`Online: ${net.onlineText ?? '—'} | Type: ${net.type ?? '—'} | Downlink: ${net.downlink ?? '—'} | RTT: ${net.rtt ?? '—'}`)
  lines.push('')
  lines.push('PERFORMANCE')
  lines.push(`Event-loop lag: avg ${perf.loopLag?.avgMs ?? '—'}ms, max ${perf.loopLag?.maxMs ?? '—'}ms | Long tasks: ${perf.longTasks?.count ?? 0} (max ${Math.round(perf.longTasks?.maxMs ?? 0)}ms)`)
  if (perf.memory?.used != null){
    lines.push(`JS Heap used: ${Math.round(perf.memory.used/1024/1024)} MB (limit ${Math.round((perf.memory.limit||0)/1024/1024)} MB)`)
  }
  lines.push('')
  lines.push('POWER')
  if (bat.battery){
    lines.push(`Battery: ${bat.battery.level ?? '—'}% | Charging: ${bat.battery.charging ? 'Yes' : 'No'} | Discharge: ${fmtTime(bat.battery.dischargingTime)}`)
  }else{
    lines.push('Battery: Unavailable in this browser')
  }
  lines.push('')
  lines.push('STORAGE')
  lines.push(`Persisted: ${storage.persisted == null ? '—' : (storage.persisted ? 'Yes' : 'No')} | IndexedDB: ${storage.indexedDB?.supported ? (storage.indexedDB.ok ? 'OK' : 'Blocked') : 'Unsupported'}`)
  if (storage.quota){
    const q = storage.quota
    const used = q.usage != null ? Math.round(q.usage/1024/1024) : null
    const quota = q.quota != null ? Math.round(q.quota/1024/1024) : null
    lines.push(`Quota estimate: ${used ?? '—'} MB used / ${quota ?? '—'} MB available`)
  }
  lines.push('')
  lines.push('ACCESSIBILITY')
  lines.push(`Reduced motion: ${a11y.reducedMotion ? 'Yes' : 'No'} | Contrast: ${a11y.contrastMore ? 'More' : (a11y.contrastLess ? 'Less' : 'Default')} | Pointer: ${a11y.pointer ?? '—'} | Hover: ${a11y.hover ?? '—'}`)
  lines.push('')
  lines.push('SECURITY CONTEXT')
  lines.push(`Secure context: ${sec.isSecureContext ? 'Yes' : 'No'} | COI: ${sec.crossOriginIsolated ? 'Yes' : 'No'} | Protocol: ${sec.protocol ?? '—'} | NextHop: ${sec.nextHopProtocol ?? '—'}`)
  lines.push(`Service worker: ${sec.serviceWorkerSupported ? (sec.serviceWorkerControlled ? 'Controlled' : 'Supported') : 'Unsupported'}`)
  lines.push('')
  lines.push('SESSION')
  lines.push(`Navigation: ${sess.navType ?? '—'} | Visibility: ${sess.visibility ?? '—'} | Focused: ${sess.focused == null ? '—' : (sess.focused ? 'Yes' : 'No')} | BFCache restore: ${sess.bfcacheRestore ? 'Yes' : 'No'}`)

  return lines.join('\n')
}

export default function CopySummary({ diagnostics, onToast }){
  const [busy, setBusy] = useState(false)

  async function copy(){
    if (busy) return
    setBusy(true)
    try{
      const text = buildSummary(diagnostics)
      await navigator.clipboard.writeText(text)
      onToast?.('Copied', 'Snapshot summary copied to clipboard.')
    }catch{
      onToast?.('Clipboard blocked', 'Browser prevented clipboard access.')
    }finally{
      setBusy(false)
    }
  }

  return (
    <button className="btn" onClick={copy} disabled={busy}>
      {busy ? 'Copying…' : 'Copy Summary'}
    </button>
  )
}
