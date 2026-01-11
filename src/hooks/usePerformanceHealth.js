import { useEffect, useMemo, useRef, useState } from 'react'
import { useInterval } from './useInterval.js'

// Performance & runtime health signals (client-side only).
// - Memory: Chromium exposes performance.memory (not standardized).
// - Long tasks: PerformanceObserver('longtask') (where supported).
// - Event loop lag: timer drift measurement.

function readMemory(){
  try{
    const m = performance?.memory
    if (!m) return null
    return {
      used: m.usedJSHeapSize,
      total: m.totalJSHeapSize,
      limit: m.jsHeapSizeLimit
    }
  }catch{
    return null
  }
}

export function usePerformanceHealth(){
  const [memory, setMemory] = useState(() => readMemory())
  const [longTasks, setLongTasks] = useState(() => ({ supported: false, count: 0, totalMs: 0, maxMs: 0 }))
  const lagRef = useRef({ expected: 0, max: 0, avg: 0, n: 0 })
  const [loopLag, setLoopLag] = useState({ maxMs: 0, avgMs: 0 })

  // Memory update (light)
  useInterval(() => setMemory(readMemory()), 1500)

  // Long task observer
  useEffect(() => {
    let obs = null
    try{
      if (typeof PerformanceObserver === 'undefined') return
      obs = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (!entries?.length) return
        setLongTasks(prev => {
          let count = prev.count
          let totalMs = prev.totalMs
          let maxMs = prev.maxMs
          for (const e of entries){
            const d = Number(e.duration || 0)
            count += 1
            totalMs += d
            if (d > maxMs) maxMs = d
          }
          return { supported: true, count, totalMs, maxMs }
        })
      })
      obs.observe({ type: 'longtask', buffered: true })
      setLongTasks(prev => ({ ...prev, supported: true }))
    }catch{
      // Not supported / blocked
      setLongTasks({ supported: false, count: 0, totalMs: 0, maxMs: 0 })
    }
    return () => {
      try{ obs?.disconnect?.() }catch{}
    }
  }, [])

  // Event loop lag: measure drift every 250ms
  useEffect(() => {
    let alive = true
    let t0 = performance.now()
    lagRef.current.expected = t0 + 250

    const id = setInterval(() => {
      const now = performance.now()
      const drift = Math.max(0, now - lagRef.current.expected)
      const s = lagRef.current
      s.n += 1
      s.avg = s.avg + (drift - s.avg) / s.n
      if (drift > s.max) s.max = drift
      lagRef.current.expected = now + 250
    }, 250)

    const raf = requestAnimationFrame(function update(){
      if (!alive) return
      const s = lagRef.current
      setLoopLag({
        maxMs: Math.round(s.max),
        avgMs: Math.round(s.avg)
      })
      requestAnimationFrame(update)
    })

    return () => {
      alive = false
      clearInterval(id)
      cancelAnimationFrame(raf)
    }
  }, [])

  const summary = useMemo(() => {
    const mem = memory
    return {
      memorySupported: !!mem,
      memory,
      longTasks,
      loopLag
    }
  }, [memory, longTasks, loopLag])

  return summary
}
