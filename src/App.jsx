import React, { useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Card from './components/Card.jsx'
import StatRow from './components/StatRow.jsx'
import Terminal from './components/Terminal.jsx'
import PingTest from './components/PingTest.jsx'
import ExportPDF from './components/ExportPDF.jsx'
import ExportJSON from './components/ExportJSON.jsx'
import CopySummary from './components/CopySummary.jsx'
import SnapshotTools from './components/SnapshotTools.jsx'
import { ToastProvider, useToasts } from './components/Toasts.jsx'
import { useSystemInfo } from './hooks/useSystemInfo.js'
import { useNetworkInfo } from './hooks/useNetworkInfo.js'
import { useStorageUsage } from './hooks/useStorageUsage.js'
import { useClock } from './hooks/useClock.js'
import { useOnline } from './hooks/useOnline.js'
import { usePerformanceHealth } from './hooks/usePerformanceHealth.js'
import { useBattery } from './hooks/useBattery.js'
import { useMediaSupport } from './hooks/useMediaSupport.js'
import { useA11yPrefs } from './hooks/useA11yPrefs.js'
import { useStorageHealth } from './hooks/useStorageHealth.js'
import { usePermissionsInfo } from './hooks/usePermissionsInfo.js'
import { useSecurityInfo } from './hooks/useSecurityInfo.js'
import { useSessionSignals } from './hooks/useSessionSignals.js'
import { formatBytes } from './utils/format.js'

function AppInner(){
  const { push } = useToasts()
  const { info, display } = useSystemInfo()
  const net = useNetworkInfo()
  const { bytes, refresh } = useStorageUsage()
  const { time, date } = useClock()
  const online = useOnline()

  const perf = usePerformanceHealth()
  const battery = useBattery()
  const media = useMediaSupport()
  const a11y = useA11yPrefs()
  const storageHealth = useStorageHealth()
  const perms = usePermissionsInfo()
  const security = useSecurityInfo()
  const session = useSessionSignals()

  const [latency, setLatency] = useState(null)
  const [fps, setFps] = useState(null)

  const [redacted, setRedacted] = useState(() => {
    try{ return localStorage.getItem('nexus_redacted_v1') === '1' }catch{ return false }
  })

  React.useEffect(() => {
    try{ localStorage.setItem('nexus_redacted_v1', redacted ? '1' : '0') }catch{}
  }, [redacted])

  // Lightweight FPS estimate (1s window)
  React.useEffect(() => {
    let raf = 0
    let frames = 0
    let last = performance.now()

    const tick = (t) => {
      frames++
      const dt = t - last
      if (dt >= 1000){
        setFps(Math.round((frames * 1000) / dt))
        frames = 0
        last = t
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const privacy = useMemo(() => {
    const items = []
    items.push({ k:'Do Not Track', v: info.dnt })
    items.push({ k:'Cookies', v: info.cookieEnabled })
    items.push({ k:'Touch Support', v: ('ontouchstart' in window) ? 'Likely' : 'Unknown/No' })
    items.push({ k:'Storage Access', v: (bytes == null) ? 'Blocked/Unavailable' : 'Available' })
    return items
  }, [info.dnt, info.cookieEnabled, bytes])

  const diagnostics = useMemo(() => ({
    system: { info, display },
    network: { ...net, onlineText: online ? 'Connected' : 'Offline' },
    storageUsage: { bytes },
    storageHealth,
    clock: { time, date },
    performance: perf,
    battery,
    media,
    a11y,
    permissions: perms,
    security,
    session,
    runtime: { fps, latency }
  }), [info, display, net, online, bytes, storageHealth, time, date, perf, battery, media, a11y, perms, security, session, fps, latency])

  const systemContext = useMemo(() => ({
    ...diagnostics,
    redacted
  }), [diagnostics, redacted])

  function toast(title, msg){ push(title, msg) }

  function clearStorage(){
    try{
      localStorage.clear()
      refresh()
      toast('Storage cleared', 'Local storage has been wiped for this origin.')
    }catch{
      toast('Storage blocked', 'Browser prevented access to localStorage.')
    }
  }

  const onlineTone = online ? 'good' : 'bad'
  const onlineLabel = online ? 'Connected' : 'Offline'

  const netType = net.supported ? (net.effectiveType || 'WIFI/ETH') : 'Not Supported'
  const down = net.supported ? (net.downlink != null ? `~${net.downlink} Mbps` : '—') : '—'
  const rtt = net.supported ? (net.rtt != null ? `${net.rtt} ms` : '—') : '—'

  const kpi = [
    { label:'Status', val: onlineLabel, tone: onlineTone },
    { label:'FPS', val: fps ? `${fps}` : '—' },
    { label:'Local Storage', val: bytes == null ? '—' : formatBytes(bytes) },
    { label:'Latency', val: latency == null ? '—' : `${latency.toFixed(2)} ms` }
  ]

  return (
    <>
      <div className="bgFX" aria-hidden="true" />
      <Navbar />

      {/* Snapshot region for PDF export */}
      <div id="snapshot" className="container">
        <header className="hero">
          <div className="heroCard">
            <div className="heroTop">
              <div className="brand">
                <div className="logo" aria-hidden="true" />
                <div>
                  <div className="brandName">NEXUS DIAGNOSTICS</div>
                  <div className="small">Real-time browser environment overview</div>
                </div>
              </div>

              <div className="actions" style={{marginTop:0}}>
                <ExportPDF targetId="snapshot" onToast={toast} />
                <ExportJSON diagnostics={diagnostics} redacted={redacted} onToast={toast} />
                <CopySummary diagnostics={diagnostics} onToast={toast} />
                <button className="btn btnGhost" onClick={() => setRedacted(v => !v)}>
                  {redacted ? 'Redacted: ON' : 'Redacted: OFF'}
                </button>
                <button
                  className="btn btnPrimary"
                  onClick={() => document.getElementById('specs')?.scrollIntoView({behavior:'smooth'})}
                >
                  Run Diagnostics
                </button>
              </div>
            </div>

            <h1 className="heroH1">
              Analyze your <span className="grad">runtime environment</span> like a game HUD.
            </h1>
            <p className="heroP">
              This console reads supported browser APIs to display hardware, display, network,
              storage, and privacy signals. It updates live and degrades gracefully when data is unavailable.
            </p>

            <div className="kpiBar" aria-label="Key metrics">
              {kpi.map((k) => (
                <div className="kpi" key={k.label}>
                  <div className="kpiLabel">{k.label}</div>
                  <div className="kpiVal" style={k.tone ? {color:`var(--${k.tone === 'good' ? 'good' : 'bad'})`} : null}>
                    {k.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <main>
          {/* System Specs */}
          <section id="specs" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Hardware & OS</h2>
                <p className="sub">Device signals exposed by the browser (privacy-capped in many cases).</p>
              </div>
              <span className="miniBadge" title="Live connection status">
                <span className={`dot ${online ? 'dotGood' : 'dotWarn'}`} />
                <span>{onlineLabel}</span>
              </span>
            </div>

            <div className="grid3">
              <Card title="Processor & Platform" badge="SYSTEM">
                <StatRow label="CPU Cores" value={info.cores ?? 'Unknown'} />
                <StatRow label="Platform" value={info.platform} />
                <StatRow label="Device Memory" value={info.deviceMemory ? `~${info.deviceMemory} GB` : 'Privacy-capped'} />
                <StatRow label="Language" value={info.lang} />
              </Card>

              <Card title="Display & Viewport" badge="DISPLAY">
                <StatRow label="Screen Resolution" value={display.resolution} />
                <StatRow label="Viewport" value={display.viewport} />
                <StatRow label="Color Depth" value={display.colorDepth} />
                <StatRow label="Pixel Ratio" value={display.pixelRatio} />
              </Card>

              <Card title="Browser Identity" badge="BROWSER">
                <StatRow label="Browser" value={info.browser} />
                <StatRow label="Online" value={onlineLabel} tone={online ? 'good' : 'warn'} />
                <StatRow label="User Agent" value={redacted ? 'Redacted (toggle in header)' : ((info.ua || '').slice(0, 44) + ((info.ua || '').length > 44 ? '…' : ''))} />
                <StatRow label="UA Length" value={(info.ua || '').length ? `${(info.ua || '').length} chars` : '—'} />
              </Card>
            </div>
          </section>

          {/* Performance */}
          <section id="performance" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Performance & Runtime Health</h2>
                <p className="sub">Signals that help explain stutter, jank, and slowdowns (no tracking, no uploads).</p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>Live</span>
              </span>
            </div>

            <div className="grid3">
              <Card title="Loop & Frame" badge="PERF">
                <StatRow label="FPS (est.)" value={fps ?? '—'} />
                <StatRow label="Event-loop lag (avg)" value={`${perf.loopLag?.avgMs ?? '—'} ms`} />
                <StatRow label="Event-loop lag (max)" value={`${perf.loopLag?.maxMs ?? '—'} ms`} />
                <StatRow label="Long tasks" value={perf.longTasks?.supported ? `${perf.longTasks.count}` : 'Not supported'} />
                <StatRow label="Longest task" value={perf.longTasks?.supported ? `${Math.round(perf.longTasks.maxMs)} ms` : '—'} />
              </Card>

              <Card title="JS Memory (where available)" badge="HEAP">
                <StatRow label="Support" value={perf.memorySupported ? 'Detected' : 'Not exposed'} tone={perf.memorySupported ? 'good' : 'warn'} />
                <StatRow label="Used" value={perf.memory?.used != null ? formatBytes(perf.memory.used) : '—'} />
                <StatRow label="Total" value={perf.memory?.total != null ? formatBytes(perf.memory.total) : '—'} />
                <StatRow label="Limit" value={perf.memory?.limit != null ? formatBytes(perf.memory.limit) : '—'} />
                <div className="small" style={{ marginTop: 10 }}>
                  Heap values are Chromium-only and privacy-sensitive. Treat as a hint, not a measurement tool.
                </div>
              </Card>

              <Card title="Power" badge="BATTERY">
                <StatRow label="API" value={battery.supported ? 'Supported' : 'Not supported'} tone={battery.supported ? 'good' : 'warn'} />
                <StatRow label="Level" value={battery.battery ? `${battery.battery.level}%` : '—'} />
                <StatRow label="Charging" value={battery.battery ? (battery.battery.charging ? 'Yes' : 'No') : '—'} />
                <StatRow label="Charge time" value={battery.battery ? (battery.battery.chargingTime === Infinity ? '∞' : `${battery.battery.chargingTime}s`) : '—'} />
                <StatRow label="Discharge time" value={battery.battery ? (battery.battery.dischargingTime === Infinity ? '∞' : `${battery.battery.dischargingTime}s`) : '—'} />
              </Card>
            </div>
          </section>

          {/* Capabilities */}
          <section id="capabilities" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Media & Capability Matrix</h2>
                <p className="sub">Helpful for streaming, recording, and compatibility checks.</p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>{media.mediaCapabilities ? 'MediaCapabilities Present' : 'Basic Checks Only'}</span>
              </span>
            </div>

            <div className="grid2">
              <Card title="Codec Support" badge="MEDIA">
                <div className="list">
                  {media.rows?.map((r, idx) => (
                    <div className="listItem" key={idx}>
                      <div className="listKey">{r.group}: {r.name}</div>
                      <div className="listVal">{r.canPlay}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Why this matters" badge="GUIDE">
                <div className="small">
                  <p style={{margin:'0 0 10px'}}>
                    Browsers differ dramatically in what formats they decode efficiently. This helps you choose exports for videos, audio previews,
                    and screenshots that work everywhere.
                  </p>
                  <p style={{margin:'0 0 10px'}}>
                    The MediaCapabilities rows are a best-effort hint about smooth playback and power efficiency.
                  </p>
                  <p style={{margin:0}}>
                    No device enumeration occurs here (no listing of microphones/cameras). This is strictly format capability reporting.
                  </p>
                </div>
              </Card>
            </div>
          </section>

          {/* Storage health */}
          <section id="storage" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Storage Health & Persistence</h2>
                <p className="sub">A deeper view than raw localStorage size: quota, persistence, and IndexedDB availability.</p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>{storageHealth.persisted == null ? '—' : (storageHealth.persisted ? 'Persisted' : 'Not Persisted')}</span>
              </span>
            </div>

            <div className="grid3">
              <Card title="Quota Estimate" badge="QUOTA">
                <StatRow label="Supported" value={storageHealth.quota ? 'Yes' : 'No'} tone={storageHealth.quota ? 'good' : 'warn'} />
                <StatRow label="Usage" value={storageHealth.quota?.usage != null ? formatBytes(storageHealth.quota.usage) : '—'} />
                <StatRow label="Quota" value={storageHealth.quota?.quota != null ? formatBytes(storageHealth.quota.quota) : '—'} />
                <div className="small" style={{ marginTop: 10 }}>
                  Estimate values vary and may be rounded. Useful for "are we near storage pressure" checks.
                </div>
              </Card>

              <Card title="Persistence" badge="PERSIST">
                <StatRow label="Persisted" value={storageHealth.persisted == null ? 'Unavailable' : (storageHealth.persisted ? 'Yes' : 'No')} tone={storageHealth.persisted ? 'good' : 'warn'} />
                <StatRow label="LocalStorage" value={bytes == null ? 'Blocked' : 'OK'} tone={bytes == null ? 'warn' : 'good'} />
                <StatRow label="Storage Used" value={bytes == null ? '—' : formatBytes(bytes)} />
                <div className="small" style={{ marginTop: 10 }}>
                  Persisted storage is less likely to be evicted under pressure. Many browsers require user engagement to grant persistence.
                </div>
              </Card>

              <Card title="IndexedDB" badge="IDB">
                <StatRow label="Supported" value={storageHealth.indexedDB?.supported ? 'Yes' : 'No'} tone={storageHealth.indexedDB?.supported ? 'good' : 'warn'} />
                <StatRow label="Health" value={storageHealth.indexedDB?.supported ? (storageHealth.indexedDB.ok ? 'OK' : 'Blocked/Error') : '—'} tone={storageHealth.indexedDB?.supported && storageHealth.indexedDB.ok ? 'good' : 'warn'} />
                <div className="small" style={{ marginTop: 10 }}>
                  IndexedDB is commonly used for offline caches, logs, and structured data. Blocking it can break advanced apps.
                </div>
              </Card>
            </div>
          </section>

          {/* Permissions */}
          <section id="permissions" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Permissions Overview</h2>
                <p className="sub">A safe read-only view of permission states. No permission prompts are triggered.</p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>{perms.supported ? 'Permissions API' : 'Unavailable'}</span>
              </span>
            </div>

            <div className="grid2">
              <Card title="Permission States" badge="PERMS">
                <div className="list">
                  {perms.rows?.map((r) => (
                    <div className="listItem" key={r.name}>
                      <div className="listKey">{r.name}</div>
                      <div className="listVal">{r.state}</div>
                    </div>
                  ))}
                </div>
                <div className="small" style={{ marginTop: 10 }}>
                  "Unavailable" usually means the browser blocks querying this permission or the feature does not exist.
                </div>
              </Card>

              <Card title="Session Signals" badge="SESSION">
                <StatRow label="Navigation type" value={session.navType} />
                <StatRow label="Visibility" value={session.visibility} />
                <StatRow label="Focused" value={session.focused == null ? '—' : (session.focused ? 'Yes' : 'No')} />
                <StatRow label="Visibility changes" value={session.visibilityChanges} />
                <StatRow label="Focus changes" value={session.focusChanges} />
                <StatRow label="BFCache restore" value={session.bfcacheRestore ? 'Yes' : 'No'} />
                <div className="small" style={{ marginTop: 10 }}>
                  Useful for debugging "why did updates pause" when tabs are backgrounded or throttled.
                </div>
              </Card>
            </div>
          </section>

          {/* Accessibility */}
          <section id="accessibility" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Accessibility Preferences</h2>
                <p className="sub">Display and interaction preferences reported by the OS/browser.</p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>{a11y.colorScheme} scheme</span>
              </span>
            </div>

            <div className="grid3">
              <Card title="Motion & Contrast" badge="A11Y">
                <StatRow label="Reduced motion" value={a11y.reducedMotion ? 'Yes' : 'No'} />
                <StatRow label="Reduced transparency" value={a11y.reducedTransparency ? 'Yes' : 'No'} />
                <StatRow label="Contrast" value={a11y.contrastMore ? 'More' : (a11y.contrastLess ? 'Less' : 'Default')} />
                <StatRow label="Forced colors" value={a11y.forcedColors ? 'Active' : 'Off'} />
              </Card>

              <Card title="Pointer" badge="INPUT">
                <StatRow label="Pointer" value={a11y.pointer} />
                <StatRow label="Hover" value={a11y.hover} />
                <div className="small" style={{ marginTop: 10 }}>
                  Helps choose UI hit targets for touch vs mouse and hover-enabled surfaces.
                </div>
              </Card>

              <Card title="Recommendations" badge="UX">
                <div className="small">
                  <p style={{margin:'0 0 10px'}}>
                    If reduced motion is enabled, prefer fewer animated glows and use gentle fades.
                  </p>
                  <p style={{margin:'0 0 10px'}}>
                    If contrast is set to "more" or forced colors are active, ensure critical info is not encoded by color alone.
                  </p>
                  <p style={{margin:0}}>
                    This tool reads preferences only; it never changes your OS settings.
                  </p>
                </div>
              </Card>
            </div>
          </section>

          {/* Security context */}
          <section id="security" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Security Context</h2>
                <p className="sub">High-level browser security signals useful for debugging features and deployment configuration.</p>
              </div>
              <span className="miniBadge">
                <span className={`dot ${security.isSecureContext ? 'dotGood' : 'dotWarn'}`} />
                <span>{security.isSecureContext ? 'Secure Context' : 'Not Secure'}</span>
              </span>
            </div>

            <div className="grid3">
              <Card title="Context" badge="SEC">
                <StatRow label="Protocol" value={security.protocol} />
                <StatRow label="Secure context" value={security.isSecureContext ? 'Yes' : 'No'} tone={security.isSecureContext ? 'good' : 'warn'} />
                <StatRow label="Cross-Origin Isolated" value={security.crossOriginIsolated ? 'Yes' : 'No'} />
                <StatRow label="Next hop protocol" value={security.nextHopProtocol} />
              </Card>

              <Card title="Service Worker" badge="SW">
                <StatRow label="Supported" value={security.serviceWorkerSupported ? 'Yes' : 'No'} tone={security.serviceWorkerSupported ? 'good' : 'warn'} />
                <StatRow label="Controlled" value={security.serviceWorkerControlled ? 'Yes' : 'No'} />
                <div className="small" style={{ marginTop: 10 }}>
                  Controlled means a service worker is actively handling this page. Useful for offline and caching behavior.
                </div>
              </Card>

              <Card title="Snapshots" badge="COMPARE">
                <SnapshotTools diagnostics={diagnostics} onToast={toast} />
                <div className="small" style={{ marginTop: 10 }}>
                  Saved locally only. Use Compare to see what changed (network, capabilities, etc.).
                </div>
              </Card>
            </div>
          </section>

          {/* Network */}
          <section id="network" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Network Analysis</h2>
                <p className="sub">Network Information API varies by browser and may be unavailable.</p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>{net.supported ? 'API Detected' : 'API Missing'}</span>
              </span>
            </div>

            <div className="grid2">
              <Card title="Connection Snapshot" badge="NET">
                <StatRow label="Effective Type" value={netType} />
                <StatRow label="Downlink (Reported)" value={down} />
                <StatRow label="RTT (Reported)" value={rtt} />
                <StatRow label="Data Saver" value={net.supported ? (net.saveData ? 'Enabled' : 'Disabled') : '—'} />
                <div style={{marginTop: 12}}>
                  <PingTest
                    onResult={(ms) => { setLatency(ms); toast('Latency test', `${ms.toFixed(2)} ms round-trip`)}}
                  />
                </div>
              </Card>

              <Card title="Stability Notes" badge="GUIDE">
                <div className="small">
                  <p style={{margin:'0 0 10px'}}>
                    Some browsers intentionally reduce precision for privacy/security. When values look missing or
                    overly-rounded, that's expected.
                  </p>
                  <p style={{margin:'0 0 10px'}}>
                    For the cleanest view: run in a modern Chromium-based browser, disable aggressive tracking protection,
                    and allow this page to store local data.
                  </p>
                  <p style={{margin:0}}>
                    Tip: Export a PDF snapshot before sharing results with someone else.
                  </p>
                </div>
              </Card>
            </div>
          </section>

          {/* Tools */}
          <section id="tools" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Utilities</h2>
                <p className="sub">Small tools that feel like a game console: clean, fast, and reliable.</p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>{time}</span>
              </span>
            </div>

            <div className="grid3">
              <Card title="Local Storage" badge="STORAGE">
                <StatRow label="Used" value={bytes == null ? 'Blocked/Unavailable' : formatBytes(bytes)} />
                <StatRow label="Estimated Limit" value="Varies by browser" />
                <div style={{display:'flex', gap:10, flexWrap:'wrap', marginTop: 12}}>
                  <button className="btn btnGhost" onClick={() => toast('Snapshot', `Storage: ${bytes == null ? '—' : formatBytes(bytes)}`)}>
                    Quick Toast
                  </button>
                  <button className="btn" onClick={clearStorage}>
                    Clear Storage
                  </button>
                </div>
              </Card>

              <Card title="System Time" badge="CLOCK">
                <div style={{textAlign:'center', padding:'6px 0 2px'}}>
                  <div style={{fontFamily:'var(--mono)', fontWeight:900, fontSize:'2rem', color:'rgba(234,242,255,.92)'}}>
                    {time}
                  </div>
                  <div className="small" style={{marginTop:6}}>{date}</div>
                  <div className="sep" />
                  <div className="small">FPS (est.): <span style={{fontFamily:'var(--mono)', color:'var(--neon)', fontWeight:900}}>{fps ?? '—'}</span></div>
                </div>
              </Card>

              <Card title="Command Line" badge="CLI">
                <Terminal
                  contextInfo={systemContext}
                  onToast={(t,m)=>toast(t,m)}
                />
              </Card>
            </div>
          </section>

          {/* Safety */}
          <section id="safety" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Safety & Legal Scope</h2>
                <p className="sub">Built to be useful without collecting sensitive data or enabling malicious behavior.</p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>Privacy-first</span>
              </span>
            </div>

            <div className="grid2">
              <Card title="What this tool DOES" badge="SAFE">
                <div className="small">
                  <p style={{margin:'0 0 10px'}}>
                    Reads standard browser APIs that are already exposed to the page you opened (hardwareConcurrency, screen metrics,
                    connectivity hints, capability checks, and accessibility preferences).
                  </p>
                  <p style={{margin:'0 0 10px'}}>
                    Generates exports locally (PDF/JSON) and stores optional snapshots only in localStorage on your device.
                  </p>
                  <p style={{margin:0}}>
                    Permission checks are read-only: no permission prompts are triggered.
                  </p>
                </div>
              </Card>

              <Card title="What this tool does NOT collect" badge="NOPE">
                <div className="list">
                  {[
                    'No precise location (no GPS/geolocation reads)',
                    'No camera/mic enumeration or recordings',
                    'No installed fonts/plugins enumeration',
                    'No local network scanning / port probing',
                    'No keystroke logging or background tracking',
                    'No cross-site identifiers or fingerprinting attempts'
                  ].map((t) => (
                    <div className="listItem" key={t}>
                      <div className="listKey">Blocked by design</div>
                      <div className="listVal">{t}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </section>

          {/* Privacy */}
          <section id="privacy" className="section">
            <div className="h2Row">
              <div>
                <h2 className="h2">Privacy & Security</h2>
                <p className="sub">A clear view of what the browser reveals and what it intentionally hides.</p>
              </div>
              <span className="miniBadge">
                <span className="dot dotGood" />
                <span>Client-Side Only</span>
              </span>
            </div>

            <div className="grid2">
              <Card title="Signals" badge="PRIVACY">
                {privacy.map(p => (
                  <StatRow key={p.k} label={p.k} value={p.v} />
                ))}
              </Card>

              <Card title="Data Policy" badge="LOCAL">
                <div className="small">
                  <p style={{margin:'0 0 10px'}}>
                    NEXUS runs entirely in your browser. It does not send your diagnostics to a server.
                    Any stored data is limited to your browser&apos;s local storage for this origin.
                  </p>
                  <p style={{margin:'0 0 10px'}}>
                    If you deploy this, consider adding your own analytics only if you have a clear privacy policy.
                  </p>
                  <p style={{margin:0}}>
                    Exported PDFs are generated on-device and downloaded directly—no upload occurs.
                  </p>
                </div>
              </Card>
            </div>

            <footer className="footer">
              <div className="sep" />
              <div className="small">
                NEXUS Diagnostics — built with Vite + React. Neon-green HUD styling for PC, tablet, and mobile.
              </div>
            </footer>
          </section>
        </main>
      </div>
    </>
  )
}

export default function App(){
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
