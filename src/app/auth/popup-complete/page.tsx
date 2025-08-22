"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function PopupComplete() {
  const params = useSearchParams()
  useEffect(() => {
    const dst = params.get('dst') || '/dashboard'
    // Notify opener and close
    try {
      window.opener?.postMessage({ type: 'tc:signed-in', dst }, window.location.origin)
    } catch {}
    setTimeout(() => { window.close() }, 100)
  }, [params])
  return null
}


