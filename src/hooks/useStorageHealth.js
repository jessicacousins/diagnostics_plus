import { useEffect, useState } from 'react'

async function getPersisted(){
  try{
    if (!navigator.storage?.persisted) return null
    return await navigator.storage.persisted()
  }catch{
    return null
  }
}

async function estimate(){
  try{
    if (!navigator.storage?.estimate) return null
    return await navigator.storage.estimate()
  }catch{
    return null
  }
}

async function testIndexedDB(){
  return new Promise(resolve => {
    try{
      if (!window.indexedDB) return resolve({ supported: false, ok: false })
      const req = window.indexedDB.open('nexus_diag_health', 1)
      req.onerror = () => resolve({ supported: true, ok: false })
      req.onupgradeneeded = () => { /* create noop */ }
      req.onsuccess = () => {
        try{ req.result.close() }catch{}
        resolve({ supported: true, ok: true })
      }
    }catch{
      resolve({ supported: false, ok: false })
    }
  })
}

export function useStorageHealth(){
  const [persisted, setPersisted] = useState(null)
  const [quota, setQuota] = useState(null)
  const [idb, setIdb] = useState({ supported: false, ok: false })

  useEffect(() => {
    let alive = true
    ;(async () => {
      const p = await getPersisted()
      const q = await estimate()
      const i = await testIndexedDB()
      if (!alive) return
      setPersisted(p)
      setQuota(q)
      setIdb(i)
    })()
    return () => { alive = false }
  }, [])

  return { persisted, quota, indexedDB: idb }
}
