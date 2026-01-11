import { useEffect, useMemo, useState } from 'react'

function readNow(){
  const nav = performance.getEntriesByType?.('navigation')?.[0]
  const navType = nav?.type || (performance.navigation ? performance.navigation.type : '—')
  const visibility = document.visibilityState || '—'
  const focused = typeof document.hasFocus === 'function' ? document.hasFocus() : null
  return { navType, visibility, focused }
}

export function useSessionSignals(){
  const [state, setState] = useState(() => ({
    ...readNow(),
    visibilityChanges: 0,
    focusChanges: 0,
    bfcacheRestore: false,
  }))

  useEffect(() => {
    const onVis = () => {
      setState(prev => ({ ...prev, ...readNow(), visibilityChanges: prev.visibilityChanges + 1 }))
    }
    const onFocus = () => {
      setState(prev => ({ ...prev, ...readNow(), focusChanges: prev.focusChanges + 1 }))
    }
    const onPageShow = (e) => {
      if (e?.persisted){
        setState(prev => ({ ...prev, bfcacheRestore: true }))
      }
    }

    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onFocus)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onFocus)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  const memo = useMemo(() => state, [state])
  return memo
}
