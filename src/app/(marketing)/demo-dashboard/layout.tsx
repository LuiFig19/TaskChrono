"use client"

import Link from 'next/link'
import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function Hamburger() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        aria-label="Open menu"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-200 transition-colors"
      >
        <span className="relative block h-4 w-5">
          <span
            className={`absolute left-0 top-0 h-0.5 w-5 bg-slate-200 transition-transform duration-300 ${
              open ? 'translate-y-2 rotate-45' : ''
            }`}
          />
          <span
            className={`absolute left-0 top-2 h-0.5 w-5 bg-slate-200 transition-opacity duration-300 ${
              open ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`absolute left-0 top-4 h-0.5 w-5 bg-slate-200 transition-transform duration-300 ${
              open ? '-translate-y-2 -rotate-45' : ''
            }`}
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 mt-2 w-56 rounded-md border border-slate-700 bg-slate-900 shadow-xl z-50"
          >
            <nav className="grid p-2 text-sm text-slate-200">
              <Link href="/demo-dashboard/inventory" className="px-3 py-2 rounded hover:bg-slate-800">Inventory Tracker</Link>
              <Link href="/demo-dashboard/summaries" className="px-3 py-2 rounded hover:bg-slate-800">Weekly Summaries</Link>
              <Link href="/demo-dashboard/settings" className="px-3 py-2 rounded hover:bg-slate-800">Account Settings</Link>
              <Link href="/demo-dashboard/notifications" className="px-3 py-2 rounded hover:bg-slate-800">Notifications</Link>
              <Link href="/demo-dashboard/reports" className="px-3 py-2 rounded hover:bg-slate-800">Reports</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function DemoDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[700px] bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/" className="font-semibold text-white">TaskChrono</Link>
          <nav className="hidden md:flex items-center justify-center gap-6 text-sm text-slate-200">
            <Link href="/demo-dashboard" className="hover:text-white">Tasks</Link>
            <Link href="/demo-dashboard/projects" className="hover:text-white">Project Manager</Link>
            <Link href="/demo-dashboard/files" className="hover:text-white">Saved Files</Link>
            <Link href="/demo-dashboard/calendar" className="hover:text-white">Calendar</Link>
          </nav>
          <div className="justify-self-end">
            <Hamburger />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}


