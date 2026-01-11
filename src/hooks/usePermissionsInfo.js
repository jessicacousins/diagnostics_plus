import { useEffect, useState } from 'react'

const DEFAULT = [
  'notifications',
  'clipboard-read',
  'clipboard-write',
  'camera',
  'microphone',
  'geolocation'
]

async function queryOne(name){
  try{
    if (!navigator.permissions?.query) return { name, state: 'Unavailable' }
    const res = await navigator.permissions.query({ name })
    return { name, state: res.state }
  }catch{
    return { name, state: 'Unavailable' }
  }
}

export function usePermissionsInfo(names = DEFAULT){
  const [supported, setSupported] = useState(false)
  const [rows, setRows] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      setSupported(!!navigator.permissions?.query)
      const results = []
      for (const n of names){
        results.push(await queryOne(n))
      }
      if (!alive) return
      setRows(results)
    })()
    return () => { alive = false }
  }, [names.join('|')])

  return { supported, rows }
}
