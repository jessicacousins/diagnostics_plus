import { useEffect, useState } from 'react'

function read(){
  if (typeof window === 'undefined') return null
  const mm = (q) => window.matchMedia ? window.matchMedia(q).matches : false
  return {
    reducedMotion: mm('(prefers-reduced-motion: reduce)'),
    reducedTransparency: mm('(prefers-reduced-transparency: reduce)'),
    contrastMore: mm('(prefers-contrast: more)'),
    contrastLess: mm('(prefers-contrast: less)'),
    colorScheme: mm('(prefers-color-scheme: light)') ? 'Light' : 'Dark',
    forcedColors: mm('(forced-colors: active)'),
    pointer: mm('(pointer: fine)') ? 'Fine' : (mm('(pointer: coarse)') ? 'Coarse' : 'Unknown'),
    hover: mm('(hover: hover)') ? 'Hover' : (mm('(hover: none)') ? 'None' : 'Unknown'),
  }
}

export function useA11yPrefs(){
  const [prefs, setPrefs] = useState(() => read())

  useEffect(() => {
    if (!window.matchMedia) return
    const queries = [
      '(prefers-reduced-motion: reduce)',
      '(prefers-reduced-transparency: reduce)',
      '(prefers-contrast: more)',
      '(prefers-contrast: less)',
      '(prefers-color-scheme: light)',
      '(forced-colors: active)',
      '(pointer: fine)',
      '(pointer: coarse)',
      '(hover: hover)',
      '(hover: none)'
    ]
    const mql = queries.map(q => window.matchMedia(q))
    const onChange = () => setPrefs(read())
    mql.forEach(m => {
      try{ m.addEventListener('change', onChange) }catch{ m.addListener?.(onChange) }
    })
    return () => {
      mql.forEach(m => {
        try{ m.removeEventListener('change', onChange) }catch{ m.removeListener?.(onChange) }
      })
    }
  }, [])

  return prefs
}
