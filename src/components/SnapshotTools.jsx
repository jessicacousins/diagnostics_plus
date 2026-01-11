import React, { useMemo, useState } from 'react'

const KEY_LATEST = 'nexus_snapshot_latest_v1'
const KEY_PREV = 'nexus_snapshot_prev_v1'

function safeParse(s){
  try{ return JSON.parse(s) }catch{ return null }
}

function diffObjects(a, b, prefix=''){
  const out = []
  const aObj = (a && typeof a === 'object') ? a : {}
  const bObj = (b && typeof b === 'object') ? b : {}

  const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)])
  for (const k of keys){
    const key = prefix ? `${prefix}.${k}` : k
    const av = aObj[k]
    const bv = bObj[k]
    const aIsObj = av && typeof av === 'object'
    const bIsObj = bv && typeof bv === 'object'

    // Arrays: summarize lengths, avoid noisy per-index diffs.
    if (Array.isArray(av) || Array.isArray(bv)){
      const al = Array.isArray(av) ? av.length : 0
      const bl = Array.isArray(bv) ? bv.length : 0
      if (al !== bl) out.push({ key, from: `len ${al}`, to: `len ${bl}` })
      continue
    }

    if (aIsObj || bIsObj){
      out.push(...diffObjects(aIsObj ? av : {}, bIsObj ? bv : {}, key))
      continue
    }

    if (String(av) !== String(bv)){
      // Keep diffs readable: clamp long strings.
      const clamp = (x) => {
        const s = x == null ? '—' : String(x)
        return s.length > 60 ? s.slice(0, 57) + '…' : s
      }
      out.push({ key, from: clamp(av), to: clamp(bv) })
    }
  }

  return out
}

export default function SnapshotTools({ diagnostics, onToast }){
  const [showDiff, setShowDiff] = useState(false)
  const [diff, setDiff] = useState([])

  const hasPrev = useMemo(() => {
    try{ return !!localStorage.getItem(KEY_PREV) }catch{ return false }
  }, [showDiff])

  function save(){
    try{
      const latest = localStorage.getItem(KEY_LATEST)
      if (latest) localStorage.setItem(KEY_PREV, latest)
      localStorage.setItem(KEY_LATEST, JSON.stringify({ ts: Date.now(), data: diagnostics }))
      onToast?.('Snapshot saved', 'Stored latest snapshot locally (no upload).')
    }catch{
      onToast?.('Save failed', 'Storage blocked or full.')
    }
  }

  function compare(){
    try{
      const prev = safeParse(localStorage.getItem(KEY_PREV))
      const latest = safeParse(localStorage.getItem(KEY_LATEST))
      if (!prev || !latest){
        onToast?.('Nothing to compare', 'Save two snapshots first.')
        return
      }
      const changes = diffObjects(prev.data, latest.data)
      setDiff(changes.slice(0, 80))
      setShowDiff(true)
      onToast?.('Comparison ready', `${Math.min(changes.length, 80)} changes listed.`)
    }catch{
      onToast?.('Compare failed', 'Unable to read local snapshots.')
    }
  }

  function clear(){
    try{
      localStorage.removeItem(KEY_LATEST)
      localStorage.removeItem(KEY_PREV)
      setShowDiff(false)
      setDiff([])
      onToast?.('Cleared', 'Local snapshots removed.')
    }catch{
      onToast?.('Clear failed', 'Storage blocked.')
    }
  }

  return (
    <div>
      <div className="actions" style={{ marginTop: 0 }}>
        <button className="btn" onClick={save}>Save Snapshot</button>
        <button className="btn" onClick={compare} disabled={!hasPrev}>Compare Last</button>
        <button className="btn btnGhost" onClick={clear}>Clear Saved</button>
      </div>

      {showDiff && (
        <div className="list" style={{ marginTop: 10 }}>
          {diff.length === 0 && (
            <div className="listItem"><div className="listKey">Result</div><div className="listVal">No differences found</div></div>
          )}
          {diff.map((d, idx) => (
            <div className="listItem" key={idx}>
              <div className="listKey">{d.key}</div>
              <div className="listVal">{String(d.from)} → {String(d.to)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
