"use client"

import { useEffect } from 'react'
import { signIn } from 'next-auth/react'

export default function Popup() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const dst = url.searchParams.get('dst') || '/dashboard'
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


