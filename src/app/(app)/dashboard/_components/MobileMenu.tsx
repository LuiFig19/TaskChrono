"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'

export default function MobileMenu({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
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
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-slate-950 to-blue-950"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-gradient-to-b from-slate-950 to-slate-900 border-l border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-4 z-[100001]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-200 font-medium">Menu</div>
                <button aria-label="Close" onClick={() => setOpen(false)} className="relative h-8 w-8 grid place-items-center rounded-md border border-slate-700 text-slate-200 bg-slate-900 hover:bg-slate-800 shadow-sm">
                  <span aria-hidden className="block relative h-3 w-5">
                    <span className={`absolute left-0 top-0 h-0.5 w-5 bg-slate-200 transition-transform duration-200 translate-y-1.5 rotate-45`}></span>
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-5 bg-slate-200 transition-opacity duration-200 opacity-0`}></span>
                    <span className={`absolute left-0 bottom-0 h-0.5 w-5 bg-slate-200 transition-transform duration-200 -translate-y-1.5 -rotate-45`}></span>
                  </span>
                </button>
              </div>
              <nav className="grid text-sm text-slate-200">
                <Link href="/dashboard/settings" className="group px-3 py-2 rounded hover:bg-slate-800/80 transition-colors" onClick={() => setOpen(false)}>
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">Settings →</span>
                </Link>
                <Link href="/dashboard/subscription" className="group px-3 py-2 rounded hover:bg-slate-800/80 transition-colors" onClick={() => setOpen(false)}>
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">Subscription →</span>
                </Link>
                <Link href="/dashboard/help" className="group px-3 py-2 rounded hover:bg-slate-800/80 transition-colors" onClick={() => setOpen(false)}>
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">Help / Support →</span>
                </Link>
                <div className="my-2 border-t border-slate-800" />
                <a href="/api/auth/signout" className="px-3 py-2 rounded hover:bg-slate-800/80">Sign Out</a>
              </nav>
              <div className="mt-4 text-xs text-slate-400">Plan: {plan.toLowerCase()}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


