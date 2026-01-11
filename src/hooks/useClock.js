import { useMemo, useState } from 'react'
import { useInterval } from './useInterval.js'

export function useClock(){
  const [now, setNow] = useState(() => new Date())
  useInterval(() => setNow(new Date()), 1000)

  const time = useMemo(() => now.toLocaleTimeString(), [now])
  const date = useMemo(() => now.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' }), [now])
  return { now, time, date }
}
