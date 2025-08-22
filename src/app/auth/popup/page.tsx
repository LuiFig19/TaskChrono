"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function Popup() {
  const params = useSearchParams()
  useEffect(() => {
    const dst = params.get('dst') || '/dashboard'
    const cb = `${window.location.origin}/auth/popup-complete?dst=${encodeURIComponent(dst)}`
    // Trigger provider directly (POST under the hood), skips NextAuth provider list page
    // use redirect=false so this window remains open until next-auth finishes redirecting us
    signIn('google', { callbackUrl: cb, redirect: true })
  }, [params])
  return null
}


