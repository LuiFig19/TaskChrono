"use client"

import { signIn, signOut } from '@/lib/better-auth-client'
import { useEffect } from 'react'

export default function LoginPopup({ signedIn, callbackUrl }: { signedIn: boolean; callbackUrl: string }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-100 p-6 shadow-2xl">
        <div className="text-lg font-semibold tc-animated-gradient">TaskChrono</div>
        <div className="text-sm text-slate-400 mt-1">{signedIn ? 'You are already signed in.' : 'Continue with your Google account.'}</div>
        <div className="mt-6 flex gap-2">
          {signedIn ? (
            <>
              <button className="px-3 py-2 rounded border border-slate-700 hover:bg-slate-800" onClick={()=>window.location.href = callbackUrl}>Go to Dashboard</button>
              <button className="px-3 py-2 rounded border border-rose-700 text-rose-300 hover:bg-rose-900/30" onClick={async ()=>{ await signOut(); window.location.href = '/' }}>Sign Out</button>
            </>
          ) : (
            <button
              className="px-4 py-2 rounded border border-slate-700 hover:bg-slate-800 w-full"
              onClick={async ()=>{
                const dst = callbackUrl || '/dashboard'
                const url = `/auth/popup?dst=${encodeURIComponent(dst)}`
                const w = 520, h = 640
                const left = Math.round(window.screenX + (window.outerWidth - w) / 2)
                const top = Math.round(window.screenY + (window.outerHeight - h) / 2)
                const features = `popup=yes,width=${w},height=${h},left=${left},top=${top}`
                const child = window.open(url, 'tc-oauth', features)
                const handler = (e: MessageEvent) => {
                  if (e.origin !== window.location.origin) return
                  if (typeof e.data === 'object' && e.data?.type === 'tc:signed-in') {
                    window.removeEventListener('message', handler)
                    try { child?.close() } catch {}
                    window.location.href = e.data?.dst || dst
                  }
                }
                window.addEventListener('message', handler)
              }}
            >
              Continue with Google
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


