import { useEffect, useState } from 'react'

function readConn(){
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!c) return { supported:false }
  return {
    supported:true,
    effectiveType: c.effectiveType ? String(c.effectiveType).toUpperCase() : null,
    downlink: typeof c.downlink === 'number' ? c.downlink : null,
    rtt: typeof c.rtt === 'number' ? c.rtt : null,
    saveData: !!c.saveData
  }
}

export function useNetworkInfo(){
  const [net, setNet] = useState(() => readConn())

  useEffect(() => {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (!c) return
    const onChange = () => setNet(readConn())
    c.addEventListener?.('change', onChange)
    return () => c.removeEventListener?.('change', onChange)
  }, [])

  return net
}
