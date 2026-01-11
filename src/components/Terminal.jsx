import React, { useEffect, useMemo, useRef, useState } from 'react'
import { safeMathEval } from '../utils/format.js'

function line(type, text){
  return { id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, type, text }
}

export default function Terminal({ contextInfo, onToast }){
  const [lines, setLines] = useState(() => ([
    line('dim', "Welcome to NEXUS CLI. Type 'help'."),
  ]))
  const [input, setInput] = useState('')
  const boxRef = useRef(null)
  const inputRef = useRef(null)

  const cmds = useMemo(() => ([
    { name:'help', desc:'List commands' },
    { name:'clear', desc:'Clear the terminal' },
    { name:'date', desc:'Print local date/time' },
    { name:'info', desc:'System summary' },
    { name:'browser', desc:'User agent string' },
    { name:'copy ua', desc:'Copy user agent to clipboard' },
    { name:'summary', desc:'One-line diagnostic summary' },
    { name:'copy json', desc:'Copy full diagnostics JSON' },
    { name:'calc <expr>', desc:'Calculator (safe subset)' },
  ]), [])

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior:'smooth' })
  }, [lines])

  function add(type, text){
    setLines(prev => [...prev, line(type, text)].slice(-120))
  }

  async function run(raw){
    const cmd = raw.trim()
    if (!cmd) return
    add('cmd', `➜ ${cmd}`)

    const lc = cmd.toLowerCase()

    if (lc === 'help'){
      add('dim', 'Commands:')
      cmds.forEach(c => add('dim', `• ${c.name} — ${c.desc}`))
      return
    }

    if (lc === 'clear'){
      setLines([line('dim', "NEXUS CLI cleared. Type 'help'.")])
      return
    }

    if (lc === 'date'){
      add('out', new Date().toString())
      return
    }

    if (lc === 'info'){
      const s = contextInfo?.system?.info || {}
      add('out', `OS: ${s.platform ?? '—'}`)
      add('out', `Browser: ${s.browser ?? '—'}`)
      add('out', `Cores: ${s.cores ?? '—'}`)
      add('out', `Language: ${s.lang ?? '—'}`)
      return
    }

    if (lc === 'browser'){
      const ua = contextInfo?.system?.info?.ua ?? navigator.userAgent
      add('out', contextInfo?.redacted ? 'Redacted (toggle in header)' : ua)
      return
    }

    if (lc === 'copy ua'){
      try{
        if (contextInfo?.redacted){
          onToast?.('Redacted', 'Turn off Redacted mode to copy UA.')
          return
        }
        const ua = contextInfo?.system?.info?.ua ?? navigator.userAgent
        await navigator.clipboard.writeText(ua)
        onToast?.('Copied', 'User agent copied to clipboard.')
      }catch{
        onToast?.('Clipboard blocked', 'Browser prevented clipboard access.')
      }
      return
    }

    if (lc === 'summary'){
      const s = contextInfo?.system?.info || {}
      const d = contextInfo?.system?.display || {}
      const n = contextInfo?.network || {}
      const r = contextInfo?.runtime || {}
      const sec = contextInfo?.security || {}
      const line = `Browser ${s.browser ?? '—'} | ${d.resolution ?? '—'} | cores ${s.cores ?? '—'} | net ${n.type ?? '—'} | fps ${r.fps ?? '—'} | secure ${sec.isSecureContext ? 'yes' : 'no'}`
      add('out', line)
      return
    }

    if (lc === 'copy json'){
      try{
        const text = JSON.stringify(contextInfo, null, 2)
        await navigator.clipboard.writeText(text)
        onToast?.('Copied', 'Diagnostics JSON copied to clipboard.')
      }catch{
        onToast?.('Clipboard blocked', 'Browser prevented clipboard access.')
      }
      return
    }

    if (lc.startsWith('calc ')){
      const expr = cmd.slice(5)
      try{
        const v = safeMathEval(expr)
        add('out', `= ${v}`)
        return
      }catch{
        add('out', 'Math error or unsupported expression.')
        return
      }
    }

    add('out', `Command not found: ${cmd}`)
  }

  function onKeyDown(e){
    if (e.key === 'Enter'){
      const val = input
      setInput('')
      run(val)
    }
    if (e.key === 'Escape'){
      setInput('')
      inputRef.current?.blur()
    }
  }

  return (
    <div className="terminal" ref={boxRef} onClick={() => inputRef.current?.focus()}>
      {lines.map(l => (
        <p
          className={l.type === 'dim' ? 'termLine termLineDim' : 'termLine'}
          key={l.id}
        >
          {l.text}
        </p>
      ))}

      <div className="termPromptRow">
        <span className="prompt">➜</span>
        <input
          ref={inputRef}
          className="termInput"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="none"
          placeholder="help | info | calc 2*(3+4)"
          aria-label="Terminal input"
        />
      </div>
    </div>
  )
}
