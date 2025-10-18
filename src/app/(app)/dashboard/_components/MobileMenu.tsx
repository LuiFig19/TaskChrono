"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'

export default function MobileMenu({ plan, userEmail }: { plan: Plan; userEmail?: string }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [orgOpen, setOrgOpen] = useState(false)
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string; role: string }>>([])
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
        className="tc-hamburger relative h-9 w-9 grid place-items-center rounded-md border transition-colors
          dark:border-slate-700 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800
          light:border-[#D8DEE4] light:bg-[#F5F7FA] light:hover:bg-[#E9ECF1] shadow-sm"
      >
        <span aria-hidden className="block relative h-3 w-5">
          <span className={`absolute left-0 top-0 h-0.5 w-5 transition-transform duration-200 ${open ? 'translate-y-1.5 rotate-45' : ''} dark:bg-slate-200 light:bg-black`}></span>
          <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-5 transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-100'} dark:bg-slate-200 light:bg-black`}></span>
          <span className={`absolute left-0 bottom-0 h-0.5 w-5 transition-transform duration-200 ${open ? '-translate-y-1.5 -rotate-45' : ''} dark:bg-slate-200 light:bg-black`}></span>
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
              <div className="fixed inset-0 z-[2147483647] bg-transparent" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ x: 280, opacity: 0, scale: 0.98 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 280, opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                className="fixed right-3 top-3 w-[280px] transform-gpu rounded-xl border p-4 z-[2147483647]
                  dark:border-indigo-600/30 dark:shadow-[0_16px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(99,102,241,0.25),0_0_18px_rgba(99,102,241,0.18)] dark:[background:linear-gradient(135deg,rgba(37,99,235,0.88),rgba(147,51,234,0.88))]
                  light:border-indigo-600/30 light:shadow-[0_16px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(99,102,241,0.25),0_0_18px_rgba(99,102,241,0.18)] light:[background:linear-gradient(135deg,rgba(37,99,235,0.88),rgba(147,51,234,0.88))]"
                data-mobile-menu
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium dark:text-slate-200 light:text-black">Quick Actions</div>
                  <button
                    aria-label="Close menu"
                    onClick={() => setOpen(false)}
                    className="relative h-8 w-8 grid place-items-center rounded-md border shadow-sm transition-colors
                      dark:border-slate-700 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800
                      light:border-black/20 light:text-black light:bg-black/10 light:hover:bg-black/20"
                    data-close-button
                  >
                    <motion.span
                      aria-hidden
                      className="block relative h-3 w-5"
                      initial={false}
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    >
                      <span className={`absolute left-0 top-0 h-0.5 w-5 transition-transform duration-200 translate-y-1.5 rotate-45 dark:bg-slate-200 light:bg-black`}></span>
                      <span className={`absolute left-0 bottom-0 h-0.5 w-5 transition-transform duration-200 -translate-y-1.5 -rotate-45 dark:bg-slate-200 light:bg-black`}></span>
                    </motion.span>
                  </button>
                </div>
                <div className="h-1 rounded-md bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 mb-3 opacity-90" />
                <nav className="grid text-sm dark:text-slate-200 light:text-black" data-menu-items style={{ color: 'black' }}>
                  <Link href="/dashboard/settings" data-menu-item className="group px-3 py-2 rounded transition-colors dark:hover:bg-slate-800 light:text-black !font-medium" onClick={() => setOpen(false)}>
                    <span style={{ color: 'black' }} className="inline-block transition-transform group-hover:translate-x-0.5">Settings →</span>
                  </Link>
                  <Link href="/dashboard/files" data-menu-item className="group px-3 py-2 rounded transition-colors dark:hover:bg-slate-800 light:text-black !font-medium" onClick={() => setOpen(false)}>
                    <span style={{ color: 'black' }} className="inline-block transition-transform group-hover:translate-x-0.5">Files →</span>
                  </Link>
                  <a
                    href="#"
                    data-menu-item
                    className="text-left px-3 py-2 rounded w-full transition-colors dark:hover:bg-slate-800/80 light:text-black"
                    onClick={async(e)=>{ e.preventDefault(); setOrgOpen(true); try { const r = await fetch('/api/org/list', { cache: 'no-store' }); if (r.ok) { const d = await r.json(); setOrgs(d.orgs || []) } } catch {} }}
                  >
                    <span style={{ color: 'black' }}>Switch Workspace…</span>
                  </a>
                  <div className="my-2 border-t dark:border-slate-800 light:border-white/20" />
                  <a 
                    href="#"
                    data-menu-item
                    className="text-left px-3 py-2 rounded w-full transition-colors dark:hover:bg-slate-800/80 light:text-black"
                    onClick={async (e) => {
                      e.preventDefault()
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
                    <span style={{ color: 'black' }}>Sign Out <span className="text-xs light:text-black" style={{ color: 'black' }}>({userEmail || ''})</span></span>
                  </a>
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body)}

      {mounted && createPortal(
        <AnimatePresence>
          {orgOpen && (
            <motion.div className="fixed inset-0 z-[2147483647]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/60" onClick={()=>setOrgOpen(false)} />
              <div className="absolute inset-0 grid place-items-center p-4">
                <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl">
                  <div className="text-slate-200 font-medium mb-2">Switch workspace</div>
                  <div className="grid gap-2 max-h-[360px] overflow-y-auto">
                    {orgs.map((o) => (
                      <button key={o.id} onClick={async()=>{ try { await fetch('/api/org/set-active', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId: o.id }) }); window.location.reload() } catch {} }} className="text-left px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-slate-200">{o.name}</div>
                          <div className="text-xs text-slate-400">Role: {o.role}</div>
                        </div>
                        <span className="text-xs text-indigo-300">Switch →</span>
                      </button>
                    ))}
                    {orgs.length === 0 && <div className="text-sm text-slate-400">No other workspaces found.</div>}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={()=>setOrgOpen(false)} className="px-3 py-2 rounded border border-slate-700 hover:bg-slate-800">Close</button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>, document.body)}
    </div>
  )
}


