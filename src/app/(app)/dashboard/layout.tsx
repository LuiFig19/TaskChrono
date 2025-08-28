import Link from 'next/link'
import React from 'react'
import LockedFeature from './_components/locked'
import { getUserPlan } from './_components/feature-gate'
import MobileMenu from './_components/MobileMenu'
import ChatClientMount from './ChatClientMount'

function Hamburger() {
  return (
    <details className="relative z-[60]">
      <summary className="list-none cursor-pointer px-3 py-2 rounded border border-slate-700 text-slate-200">☰</summary>
      {/* Backdrop to improve contrast when menu is open; clicking it closes the menu */}
      <div
        className="tc-overlay fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[95]"
        onClick={(e) => {
          const el = (e.currentTarget.parentElement as HTMLDetailsElement | null)
          if (el) el.removeAttribute('open')
        }}
      />
      <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 shadow-2xl z-[100] overflow-hidden ring-1 ring-slate-700">
        <div className="p-4 border-b border-slate-800 text-sm">
          <div className="font-medium">Account</div>
          <div className="text-slate-400">user@company.com</div>
        </div>
        <nav className="grid p-2 text-sm">
          <Link href="/dashboard/settings" className="px-3 py-2 rounded hover:bg-slate-800">Settings</Link>
          <Link href="/dashboard/subscription" className="px-3 py-2 rounded hover:bg-slate-800">Subscription</Link>
          <Link href="/dashboard/help" className="px-3 py-2 rounded hover:bg-slate-800">Help / Support</Link>
          <div className="my-2 border-t border-slate-800" />
          <button
            className="text-left px-3 py-2 rounded hover:bg-slate-800"
            onClick={async (e) => {
              e.preventDefault()
              if (typeof window === 'undefined') return
              const ok = window.confirm('Sign out and return to the TaskChrono landing page?')
              if (!ok) return
              // Use NextAuth signout endpoint, then redirect to landing
              try {
                await fetch('/api/auth/signout', { method: 'POST' })
              } catch {}
              window.location.href = '/'
            }}
          >
            Sign Out
          </button>
        </nav>
      </div>
    </details>
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const plan = await getUserPlan()
  return (
    <div className="min-h-screen grid grid-rows-[auto,1fr] bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-2.5 py-1 grid grid-cols-[auto_1fr_auto] items-center gap-2.5">
          <Link href="/dashboard" className="text-lg font-extrabold bg-gradient-to-r from-white via-indigo-300 to-violet-400 bg-clip-text text-transparent tracking-tight leading-none">
            TaskChrono <span className={`ml-2 text-xs align-top ${plan==='FREE'?'text-emerald-400':plan==='BUSINESS'?'text-rose-400':plan==='ENTERPRISE'?'text-violet-400':'text-indigo-300'}`}>{plan.toLowerCase()}</span>
          </Link>
          <nav className="hidden md:flex justify-center items-center gap-1 text-[16px] font-medium tracking-wide text-slate-200 whitespace-nowrap">
            {[{href:'/dashboard/tasks',label:'Tasks'},
              {href:'/dashboard/projects',label:'Project Manager'},
              {href:'/dashboard/inventory',label:'Inventory Tracking', lock: plan==='FREE'},
              {href:'/dashboard/analytics',label:'Analytics', lock: plan==='FREE'},
              {href:'/dashboard/files',label:'Files', lock: false},
              {href:'/dashboard/calendar',label:'Calendar', lock: false},
              // AI removed per product focus
              {href:'/dashboard/invoices',label:'Invoices', lock: !(plan==='ENTERPRISE'||plan==='CUSTOM')},
              {href:'/dashboard/timers',label:'Timers', lock: false}
            ].map(i=> (
              <Link key={i.href} href={i.href} className="group relative px-2 py-0.5 rounded-md hover:text-white transition-colors leading-none">
                <span className="transition-[filter] group-hover:drop-shadow-[0_0_6px_rgba(99,102,241,0.45)] flex items-center gap-1.5">
                  {i.label}
                  {i.lock && (
                    <span className="relative" title="">
                      <span className="select-none">🔒</span>
                      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-xs text-slate-200 bg-slate-900/95 border border-slate-700 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Upgrade your plan to access {i.label}
                      </span>
                    </span>
                  )}
                </span>
                <span className="pointer-events-none absolute inset-x-1.5 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ChatClientMount />
            <MobileMenu plan={plan as any} />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}


