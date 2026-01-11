import { useEffect, useMemo, useState } from 'react'

function canPlay(type){
  try{
    const v = document.createElement('video')
    const r = v.canPlayType(type)
    return r === 'probably' ? 'Yes (Probably)' : r === 'maybe' ? 'Yes (Maybe)' : 'No'
  }catch{
    return '—'
  }
}

async function decodeInfo(config){
  try{
    if (!navigator.mediaCapabilities?.decodingInfo) return null
    const info = await navigator.mediaCapabilities.decodingInfo(config)
    return {
      supported: !!info.supported,
      smooth: !!info.smooth,
      powerEfficient: !!info.powerEfficient,
    }
  }catch{
    return null
  }
}

export function useMediaSupport(){
  const [caps, setCaps] = useState({ supported: false, rows: [] })

  useEffect(() => {
    let alive = true

    async function run(){
      const rows = []

      // Video container + codecs
      const videoTypes = [
        { label:'H.264 (MP4)', type:'video/mp4; codecs="avc1.42E01E"' },
        { label:'HEVC (H.265)', type:'video/mp4; codecs="hev1.1.6.L93.B0"' },
        { label:'VP9 (WebM)', type:'video/webm; codecs="vp9"' },
        { label:'AV1 (WebM)', type:'video/webm; codecs="av01.0.05M.08"' },
      ]
      for (const v of videoTypes){
        rows.push({ group:'Video', name:v.label, canPlay: canPlay(v.type), cap: null })
      }

      // Audio codecs
      const audioTypes = [
        { label:'AAC (MP4)', type:'audio/mp4; codecs="mp4a.40.2"' },
        { label:'Opus (WebM)', type:'audio/webm; codecs="opus"' },
        { label:'MP3', type:'audio/mpeg' },
        { label:'WAV', type:'audio/wav' },
      ]
      for (const a of audioTypes){
        const audio = document.createElement('audio')
        const r = audio.canPlayType(a.type)
        const can = r === 'probably' ? 'Yes (Probably)' : r === 'maybe' ? 'Yes (Maybe)' : 'No'
        rows.push({ group:'Audio', name:a.label, canPlay: can, cap: null })
      }

      // Images
      const img = [
        { label:'AVIF', type:'image/avif' },
        { label:'WebP', type:'image/webp' },
      ]
      for (const i of img){
        rows.push({ group:'Images', name:i.label, canPlay: canPlay(i.type), cap: null })
      }

      // MediaCapabilities decodingInfo (a couple of representative profiles)
      const canMC = !!navigator.mediaCapabilities?.decodingInfo
      if (canMC){
        const mcTests = [
          {
            group:'MediaCapabilities',
            name:'1080p H.264 decode',
            config: {
              type:'file',
              video: { contentType:'video/mp4; codecs="avc1.42E01E"', width:1920, height:1080, bitrate:8000000, framerate:30 }
            }
          },
          {
            group:'MediaCapabilities',
            name:'4K VP9 decode',
            config: {
              type:'file',
              video: { contentType:'video/webm; codecs="vp9"', width:3840, height:2160, bitrate:20000000, framerate:30 }
            }
          },
        ]
        for (const t of mcTests){
          const info = await decodeInfo(t.config)
          rows.push({ group:t.group, name:t.name, canPlay: info ? (info.supported ? 'Supported' : 'Not supported') : '—', cap: info })
        }
      }

      if (!alive) return
      setCaps({ supported: true, rows })
    }

    run()
    return () => { alive = false }
  }, [])

  const summary = useMemo(() => ({
    mediaCapabilities: !!navigator.mediaCapabilities,
    rows: caps.rows
  }), [caps.rows])

  return summary
}
