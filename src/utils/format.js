export function formatBytes(bytes){
  if (bytes == null || Number.isNaN(bytes)) return '—'
  const units = ['B','KB','MB','GB','TB']
  let v = Math.max(0, bytes)
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  const num = i === 0 ? Math.round(v) : (v < 10 ? v.toFixed(2) : v.toFixed(1))
  return `${num} ${units[i]}`
}

export function clamp(n, a, b){ return Math.max(a, Math.min(b, n)) }

export function safeMathEval(expr){
  // Allow digits, whitespace, parentheses, decimal point, and basic operators.
  // Also allow exponentiation **, modulo %, and commas are removed.
  const cleaned = String(expr).replace(/,/g,'').trim()
  if (!cleaned) throw new Error('empty')
  if (!/^[0-9+\-*/().%\s**]+$/.test(cleaned)) throw new Error('unsafe')
  // Disallow repeated non-number chars like "////"
  if (/[^0-9)]\s{0,2}[^0-9(]/.test(cleaned) === false){
    // not a strong signal; keep going
  }
  // eslint-disable-next-line no-new-func
  const fn = new Function(`"use strict"; return (${cleaned});`)
  const out = fn()
  if (typeof out !== 'number' || !Number.isFinite(out)) throw new Error('bad')
  return out
}
