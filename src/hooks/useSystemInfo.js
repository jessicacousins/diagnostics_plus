import { useMemo } from 'react'

function guessBrowser(ua){
  const s = ua || ''
  if (s.includes('Edg/')) return 'Edge'
  if (s.includes('Firefox/')) return 'Firefox'
  if (s.includes('Chrome/')) return 'Chrome'
  if (s.includes('Safari/')) return 'Safari'
  return 'Unknown'
}

export function useSystemInfo(){
  const info = useMemo(() => {
    const n = typeof navigator === 'undefined' ? {} : navigator
    const ua = n.userAgent || ''
    const cores = n.hardwareConcurrency ?? null
    const deviceMemory = n.deviceMemory ?? null
    const lang = n.language || '—'
    const platform = n.userAgentData?.platform || n.platform || '—'
    const browser = guessBrowser(ua)
    const dnt = n.doNotTrack === '1' ? 'Enabled' : (n.doNotTrack === '0' ? 'Disabled' : 'Unknown')
    const cookieEnabled = n.cookieEnabled ? 'Enabled' : 'Disabled'
    return {
      ua, cores, deviceMemory, lang, platform, browser, dnt, cookieEnabled
    }
  }, [])

  const display = useMemo(() => {
    const s = typeof window === 'undefined' ? {} : window.screen
    return {
      resolution: s?.width && s?.height ? `${s.width} × ${s.height}` : '—',
      colorDepth: s?.colorDepth ? `${s.colorDepth} bit` : '—',
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : '—',
      viewport: typeof window !== 'undefined' ? `${window.innerWidth} × ${window.innerHeight}` : '—'
    }
  }, [])

  return { info, display }
}
