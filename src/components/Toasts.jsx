import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])

  const push = useCallback((title, msg) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`
    const t = { id, title, msg }
    setToasts(prev => [t, ...prev].slice(0, 5))
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3200)
  }, [])

  const api = useMemo(() => ({ push }), [push])

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toastWrap" aria-live="polite" aria-relevant="additions">
        {toasts.map(t => (
          <div className="toast" key={t.id}>
            <p className="toastTitle">{t.title}</p>
            <p className="toastMsg">{t.msg}</p>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToasts(){
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToasts must be used inside ToastProvider')
  return ctx
}
