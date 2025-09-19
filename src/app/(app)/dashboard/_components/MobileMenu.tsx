"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'

export default function MobileMenu({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => { setMounted(true) }, [])
  // Avoid toggling root overflow to prevent scrollbar stutter/layout shift
  return (
    <div>
      <button
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen(o=>!o)}
        className="relative h-9 w-9 grid place-items-center rounded-md border border-slate-700 text-slate-200 bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors"
      >
        <span aria-hidden className="block relative h-3 w-5">
          <span className={`absolute left-0 top-0 h-0.5 w-5 bg-slate-200 transition-transform duration-200 ${open ? 'translate-y-1.5 rotate-45' : ''}`}></span>
          <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-5 bg-slate-200 transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`absolute left-0 bottom-0 h-0.5 w-5 bg-slate-200 transition-transform duration-200 ${open ? '-translate-y-1.5 -rotate-45' : ''}`}></span>
        </span>
      </button>
      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-[2147483647]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="fixed inset-0 z-[2147483647]"
                style={{ background: 'transparent', pointerEvents: 'auto' }}
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ x: 280, opacity: 0, scale: 0.98 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 280, opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                className="fixed right-3 top-3 w-[280px] rounded-xl border border-indigo-600/30 shadow-[0_16px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(99,102,241,0.25),0_0_18px_rgba(99,102,241,0.18)] p-4 z-[2147483647]"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.88), rgba(147,51,234,0.88))',
                  pointerEvents: 'auto'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-200 font-medium">Quick Actions</div>
                  <button
                    aria-label="Close menu"
                    onClick={() => setOpen(false)}
                    className="relative h-8 w-8 grid place-items-center rounded-md border border-slate-700 text-slate-200 bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors"
                  >
                    <motion.span
                      aria-hidden
                      className="block relative h-3 w-5"
                      initial={false}
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    >
                      <span className={`absolute left-0 top-0 h-0.5 w-5 bg-slate-200 transition-transform duration-200 translate-y-1.5 rotate-45`}></span>
                      <span className={`absolute left-0 bottom-0 h-0.5 w-5 bg-slate-200 transition-transform duration-200 -translate-y-1.5 -rotate-45`}></span>
                    </motion.span>
                  </button>
                </div>
                <div className="h-1 rounded-md bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 mb-3 opacity-90" />
                <nav className="grid text-sm text-slate-200">
                  <Link href="/dashboard/settings" className="group px-3 py-2 rounded hover:bg-slate-800 transition-colors" onClick={() => setOpen(false)}>
                    <span className="inline-block transition-transform group-hover:translate-x-0.5">Settings →</span>
                  </Link>
                  <Link href="/dashboard/teams" className="group px-3 py-2 rounded hover:bg-slate-800 transition-colors" onClick={() => setOpen(false)}>
                    <span className="inline-block transition-transform group-hover:translate-x-0.5">Teams →</span>
                  </Link>
                  <div className="my-2 border-t border-slate-800" />
                  <button 
                    className="text-left px-3 py-2 rounded hover:bg-slate-800/80 w-full"
                    onClick={async () => {
                      const ok = window.confirm('Sign out and return to the TaskChrono landing page?')
                      if (!ok) return
                      try {
                        await fetch('/api/auth/signout', { method: 'POST' })
                        window.location.href = '/'
                      } catch {
                        window.location.href = '/'
                      }
                    }}
                  >
                    Sign Out
                  </button>
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body)}
    </div>
  )
}


