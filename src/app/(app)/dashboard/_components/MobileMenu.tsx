"use client"
import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'

export default function MobileMenu({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded border border-slate-700 text-slate-200 bg-slate-900/70 hover:bg-slate-900"
      >
        ☰
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 h-full w-72 bg-slate-950 border-l border-slate-800 shadow-2xl p-4 z-[10000]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-300">Account</div>
                <button onClick={() => setOpen(false)} className="text-slate-300">✕</button>
              </div>
              <nav className="grid text-sm">
                <Link href="/dashboard/settings" className="px-3 py-2 rounded hover:bg-slate-800" onClick={() => setOpen(false)}>Settings</Link>
                <Link href="/dashboard/subscription" className="px-3 py-2 rounded hover:bg-slate-800" onClick={() => setOpen(false)}>Subscription</Link>
                <Link href="/dashboard/help" className="px-3 py-2 rounded hover:bg-slate-800" onClick={() => setOpen(false)}>Help / Support</Link>
                <div className="my-2 border-t border-slate-800" />
                <a href="/api/auth/signout" className="px-3 py-2 rounded hover:bg-slate-800">Sign Out</a>
              </nav>
              <div className="mt-4 text-xs text-slate-500">Plan: {plan.toLowerCase()}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


