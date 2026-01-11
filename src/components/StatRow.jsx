import React from 'react'

export default function StatRow({ label, value, tone }){
  const style = tone === 'good'
    ? { color:'var(--good)' }
    : tone === 'warn'
    ? { color:'var(--warn)' }
    : tone === 'bad'
    ? { color:'var(--bad)' }
    : null

  return (
    <div className="row">
      <div className="label">{label}</div>
      <div className="value" style={style}>{value ?? '—'}</div>
    </div>
  )
}
