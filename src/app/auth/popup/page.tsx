"use client"

import { useEffect } from 'react'
import { signIn } from 'next-auth/react'

export default function Popup() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const dst = url.searchParams.get('dst') || '/dashboard'
      const callback = `/auth/popup-complete?dst=${encodeURIComponent(dst)}`
      // Go straight to Google provider within this popup
      window.location.replace(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callback)}`)
    } catch {
      // Fallback: navigate to root
      window.location.href = '/'
    }
  }, [])
  return null
}


