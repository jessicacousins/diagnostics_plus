import React, { useMemo, useState } from 'react'

function Icon({ children }){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  )
}

export default function Navbar(){
  const [open, setOpen] = useState(false)

  const links = useMemo(() => ([
    { id:'specs', label:'System' },
    { id:'performance', label:'Performance' },
    { id:'capabilities', label:'Capabilities' },
    { id:'storage', label:'Storage' },
    { id:'permissions', label:'Permissions' },
    { id:'accessibility', label:'A11y' },
    { id:'security', label:'Security' },
    { id:'network', label:'Network' },
    { id:'tools', label:'Tools' },
    { id:'safety', label:'Safety' },
    { id:'privacy', label:'Privacy' }
  ]), [])

  function go(id){
    setOpen(false)
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior:'smooth', block:'start' })
  }

  return (
    <>
      <div className="nav">
        <div className="container navInner">
          <div className="brand" style={{gap:10}}>
            <div className="logo" aria-hidden="true" />
            <div>
              <div className="brandName">NEXUS</div>
              <div className="small">Diagnostics Console</div>
            </div>
          </div>

          <div className="navLinks" role="navigation" aria-label="Primary">
            {links.map(l => (
              <button key={l.id} className="navLink" onClick={() => go(l.id)}>{l.label}</button>
            ))}
          </div>

          <div className="navRight">
            <button className="iconBtn mobileMenuBtn" onClick={() => setOpen(true)} aria-label="Open menu">
              <Icon>
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </Icon>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="drawer" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="drawerPanel" onClick={(e) => e.stopPropagation()}>
            <div className="drawerTop">
              <div className="brand" style={{gap:10}}>
                <div className="logo" aria-hidden="true" style={{width:34,height:34}} />
                <div>
                  <div className="brandName">NEXUS</div>
                  <div className="small">Quick Nav</div>
                </div>
              </div>
              <button className="iconBtn" onClick={() => setOpen(false)} aria-label="Close menu">
                <Icon>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </Icon>
              </button>
            </div>

            <div className="drawerLinks">
              {links.map(l => (
                <button key={l.id} className="navLink" onClick={() => go(l.id)}>{l.label}</button>
              ))}
            </div>

            <div className="sep" />
            <div className="small">
              Built for PC, tablet, and mobile. Client-side only.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
