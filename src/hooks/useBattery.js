import { useEffect, useState } from 'react'

function mapBattery(b){
  if (!b) return null
  return {
    charging: !!b.charging,
    level: typeof b.level === 'number' ? Math.round(b.level * 100) : null,
    chargingTime: Number.isFinite(b.chargingTime) ? b.chargingTime : null,
    dischargingTime: Number.isFinite(b.dischargingTime) ? b.dischargingTime : null,
  }
}

export function useBattery(){
  const [supported, setSupported] = useState(false)
  const [battery, setBattery] = useState(null)

  useEffect(() => {
    let bat = null
    let onChange = null

    async function init(){
      try{
        if (!navigator.getBattery) return
        setSupported(true)
        bat = await navigator.getBattery()
        setBattery(mapBattery(bat))
        onChange = () => setBattery(mapBattery(bat))
        bat.addEventListener('chargingchange', onChange)
        bat.addEventListener('levelchange', onChange)
        bat.addEventListener('chargingtimechange', onChange)
        bat.addEventListener('dischargingtimechange', onChange)
      }catch{
        setSupported(false)
        setBattery(null)
      }
    }

    init()

    return () => {
      try{
        if (bat && onChange){
          bat.removeEventListener('chargingchange', onChange)
          bat.removeEventListener('levelchange', onChange)
          bat.removeEventListener('chargingtimechange', onChange)
          bat.removeEventListener('dischargingtimechange', onChange)
        }
      }catch{}
    }
  }, [])

  return { supported, battery }
}
