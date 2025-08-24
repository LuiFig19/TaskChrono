"use client"

import { useEffect } from 'react'

export default function PopupComplete() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const dst = url.searchParams.get('dst') || '/dashboard'
      // Inform opener that sign-in completed
      if (window.opener) {
        window.opener.postMessage({ type: 'tc:signed-in', dst }, window.location.origin)
      }
      // Close popup
      window.close()
      // If the window didn't close (blocked), navigate instead
      setTimeout(() => { try { window.close() } catch {} }, 50)
    } catch {
      window.close()
    }
  }, [])
  return null
}


