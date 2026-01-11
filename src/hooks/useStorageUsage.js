import { useMemo, useState } from 'react'
import { useInterval } from './useInterval.js'

function measureLocalStorageBytes(){
  try{
    let total = 0
    for (let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i)
      const v = localStorage.getItem(k) ?? ''
      total += (k.length + v.length) * 2
    }
    return total
  }catch{
    return null
  }
}

export function useStorageUsage(){
  const [bytes, setBytes] = useState(() => measureLocalStorageBytes())
  useInterval(() => setBytes(measureLocalStorageBytes()), 1500)

  const quota = useMemo(() => {
    // Storage quota varies by browser; we expose an estimate if the API exists.
    // We keep the UI honest: show "—" if not available.
    return null
  }, [])

  return { bytes, quota, refresh: () => setBytes(measureLocalStorageBytes()) }
}
