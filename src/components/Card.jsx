import React from 'react'

export default function Card({ title, badge, children, right }){
  return (
    <section className="card">
      <div className="cardTitle">
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <span>{title}</span>
          {badge ? <span className="pill">{badge}</span> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div style={{position:'relative'}}>
        {children}
      </div>
    </section>
  )
}
