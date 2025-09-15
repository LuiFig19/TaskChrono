import Link from 'next/link'
import React from 'react'
import { getUserPlan } from './_components/feature-gate'
import MobileMenu from './_components/MobileMenu'
import ChatClientMount from './ChatClientMount'

function Hamburger() {
  return (
    <details className="relative z-[2147483645]">
      <summary className="list-none cursor-pointer px-3 py-2 rounded border border-slate-700 text-slate-200">☰</summary>
      <div
        className="fixed left-0 right-0 bottom-0 top-0 z-[2147483646]"
        style={{ background: 'transparent', pointerEvents: 'auto' }}
        onClick={(e) => {
          const el = (e.currentTarget.parentElement as HTMLDetailsElement | null)
          if (el) el.removeAttribute('open')
        }}
      />
      <div 
        className="absolute right-0 mt-2 w-72 rounded-xl border border-indigo-600/40 text-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(99,102,241,0.35),0_0_24px_rgba(99,102,241,0.25)] z-[2147483647] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.88), rgba(147,51,234,0.88))',
          pointerEvents: 'auto'
        }}
      >
        <div className="flex items-center justify-between p-2">
          <div className="text-sm text-slate-200 font-medium">Quick Actions</div>
          <button
            aria-label="Close menu"
            className="relative h-8 w-8 grid place-items-center rounded-md border border-slate-700 text-slate-200 bg-slate-900 hover:bg-slate-800 shadow-sm"
            onClick={(e) => {
              e.preventDefault()
              const el = (e.currentTarget.closest('details') as HTMLDetailsElement | null)
              if (el) el.removeAttribute('open')
            }}
          >
            <span aria-hidden className="block relative h-3 w-5">
              <span className={`absolute left-0 top-0 h-0.5 w-5 bg-slate-200 translate-y-1.5 rotate-45`}></span>
              <span className={`absolute left-0 bottom-0 h-0.5 w-5 bg-slate-200 -translate-y-1.5 -rotate-45`}></span>
            </span>
          </button>
        </div>
        <div className="h-1 mx-2 rounded-md bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-90" />
        <nav className="grid p-2 text-sm">
          <Link href="/dashboard/settings" className="px-3 py-2 rounded hover:bg-slate-800">Settings</Link>
          <Link href="/dashboard/teams" className="px-3 py-2 rounded hover:bg-slate-800">Teams</Link>
          <div className="my-2 border-t border-slate-800" />
          <button
            className="text-left px-3 py-2 rounded hover:bg-slate-800"
            onClick={async (e) => {
              e.preventDefault()
              if (typeof window === 'undefined') return
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
      </div>
    </details>
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const plan = await getUserPlan()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      <header data-app-nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <div className="tc-nav-inner max-w-screen-2xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-2.5">
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
              {href:'/dashboard/invoices',label:'Invoices', lock: plan==='FREE'},
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
      <main id="page-root" className="max-w-screen-2xl mx-auto w-full">{children}</main>
    </div>
  )
}


