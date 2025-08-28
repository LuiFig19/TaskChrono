"use client"

import { useEffect } from 'react'
import { signIn } from 'next-auth/react'

export default function Popup() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const dst = url.searchParams.get('dst') || '/dashboard'
      const callback = `/auth/popup-complete?dst=${encodeURIComponent(dst)}`
      // Start Google OAuth immediately (POST behind the scenes)
      void signIn('google', { callbackUrl: callback, redirect: true })
    } catch {
      // Fallback: navigate to root
      window.location.href = '/'
    }
  }, [])
  return null
}


