"use client"

import React from 'react'

export default function CompanySubtext() {
  const [name, setName] = React.useState<string>('')
  const [color, setColor] = React.useState<string>('#c7d2fe')

  React.useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const res = await fetch('/api/org/active', { cache: 'no-store' })
        if (res?.ok) {
          const data = await res.json()
          if (!ignore) {
            setName(data?.name || '')
            if (data?.brandColor) setColor(data.brandColor)
          }
        }
      } catch {}
    })()
    function onColor(e: any) { if (e?.detail?.color) setColor(e.detail.color) }
    function onName(e: any) { if (typeof e?.detail?.name === 'string') setName(e.detail.name) }
    window.addEventListener('tc:brand-color' as any, onColor as EventListener)
    window.addEventListener('tc:brand-name' as any, onName as EventListener)
    return () => { ignore = true; window.removeEventListener('tc:brand-color' as any, onColor as EventListener); window.removeEventListener('tc:brand-name' as any, onName as EventListener) }
  }, [])

  if (!name) return null
  return (
    <div className="mt-1 text-xs font-extrabold tracking-tight leading-none" style={{ color }}>
      {name}
    </div>
  )
}
