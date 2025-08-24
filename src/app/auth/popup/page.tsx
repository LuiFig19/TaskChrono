"use client"

import { useEffect } from 'react'
import { signIn } from 'next-auth/react'

export default function Popup() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const dst = url.searchParams.get('dst') || '/dashboard'
      // Ensure we run the OAuth flow on the canonical host to avoid state/cookie mismatch
      if (window.location.hostname !== 'www.taskchrono.org') {
        window.location.replace(`https://www.taskchrono.org/auth/popup?dst=${encodeURIComponent(dst)}`)
        return
      }
      const callback = `/auth/popup-complete?dst=${encodeURIComponent(dst)}`
      // Kick off Google OAuth; NextAuth will redirect back to callback
      void signIn('google', { callbackUrl: callback })
    } catch {
      // Fallback: navigate to root
      window.location.href = '/'
    }
  }, [])
  return null
}


