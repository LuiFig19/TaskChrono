"use client"

import React from 'react'
import { signIn } from '@/lib/better-auth-client'
import { AnimatePresence, motion } from 'framer-motion'

export default function Popup() {
  const url = typeof window !== 'undefined' ? new URL(window.location.href) : null
  const dst = url?.searchParams.get('dst') || '/dashboard'
  const [busyGoogle, setBusyGoogle] = React.useState(false)
  const [busyEmail, setBusyEmail] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  async function handleCredentialsSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (busyGoogle || busyEmail) return
    setBusyEmail(true)
    setError(null)
    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: dst,
      })
      if (result.error) {
        setError('Invalid email or password')
        return
      }
      // Notify parent and close
      if (window.opener) window.opener.postMessage({ type: 'tc:signed-in', dst }, window.location.origin)
      try { window.close() } catch {}
      // Fallback navigate if the popup couldn't close
      setTimeout(() => { window.location.href = dst }, 150)
    } catch (err) {
      setError('Sign in failed')
    } finally {
      setBusyEmail(false)
    }
  }

  async function handleGoogleSignIn() {
    setBusyGoogle(true)
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: dst,
      })
    } catch (err) {
      setError('Google sign in failed')
      setBusyGoogle(false)
    }
  }

  return (
    <div className="relative min-h-[100vh] overflow-hidden bg-slate-950 text-slate-100">
      {/* Animated ambient background */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-1/2 -left-1/2 size-[120vmax] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_60%)] animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 size-[120vmax] rounded-full bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.12),transparent_60%)] animate-pulse" />
      </div>

      <div className="relative min-h-[100vh] flex items-center justify-center p-2">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[420px]"
          >
            <motion.div
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(99,102,241,0.25)] backdrop-blur"
            >
              <div className="text-lg font-semibold tc-animated-gradient">TaskChrono</div>
              <div className="text-sm text-slate-400 mt-1">Sign in to continue</div>

              <div className="mt-6 grid gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGoogleSignIn}
                  className="w-full px-4 py-2 rounded-md bg-white text-black hover:shadow-lg transition-colors duration-200 cursor-pointer disabled:opacity-70"
                  disabled={busyEmail || busyGoogle}
                >
                  {busyGoogle ? 'Opening Google…' : 'Continue with Google'}
                </motion.button>

                <form onSubmit={handleCredentialsSignIn} className="grid gap-2">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="Email"
                    className="w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    className="w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    required
                  />
                  {error ? <div className="text-sm text-rose-400">{error}</div> : null}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="w-full px-4 py-2 rounded-md border border-slate-700 hover:bg-slate-800 transition-colors duration-200 cursor-pointer disabled:opacity-70"
                    disabled={busyEmail || busyGoogle}
                  >
                    {busyEmail ? 'Signing in…' : 'Sign in'}
                  </motion.button>
                </form>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => window.close()}
                  className="w-full px-4 py-2 rounded-md border border-slate-800 text-slate-300 hover:bg-slate-900 transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}


