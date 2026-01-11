import { useEffect, useState } from 'react'

function read(){
  const secure = typeof window !== 'undefined' ? window.isSecureContext : false
  const coi = typeof window !== 'undefined' ? window.crossOriginIsolated : false
  const sw = 'serviceWorker' in navigator
  const swControlled = !!navigator.serviceWorker?.controller
  const proto = (() => {
    try{
      const nav = performance.getEntriesByType?.('navigation')?.[0]
      return nav?.nextHopProtocol || '—'
    }catch{
      return '—'
    }
  })()
  return {
    isSecureContext: secure,
    crossOriginIsolated: coi,
    serviceWorkerSupported: sw,
    serviceWorkerControlled: swControlled,
    protocol: location?.protocol || '—',
    nextHopProtocol: proto
  }
}

export function useSecurityInfo(){
  const [info, setInfo] = useState(() => read())
  useEffect(() => {
    const id = setInterval(() => setInfo(read()), 2000)
    return () => clearInterval(id)
  }, [])
  return info
}
