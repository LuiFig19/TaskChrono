import Link from 'next/link'
import React from 'react'
import { getUserPlan } from './_components/feature-gate'
import MobileMenu from './_components/MobileMenu'
import CompanySubtext from './_components/CompanySubtext'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const plan = await getUserPlan()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      <header data-app-nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <div className="tc-nav-inner max-w-screen-2xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-2.5">
          <div className="leading-none">
            <Link href="/dashboard" className="text-lg font-extrabold bg-gradient-to-r from-white via-indigo-300 to-violet-400 bg-clip-text text-transparent tracking-tight leading-none">
              TaskChrono <span className={`ml-2 text-xs align-top ${plan==='FREE'?'text-emerald-400':plan==='BUSINESS'?'text-rose-400':plan==='ENTERPRISE'?'text-violet-400':'text-indigo-300'}`}>{plan.toLowerCase()}</span>
            </Link>
            {/* Company name under logo */}
            <CompanySubtext />
          </div>
          <nav className="hidden md:flex justify-center items-center gap-1 text-[16px] font-medium tracking-wide text-slate-200 whitespace-nowrap">
            {[{href:'/dashboard/tasks',label:'Tasks'},
              {href:'/dashboard/projects',label:'Project Manager'},
              {href:'/dashboard/inventory',label:'Inventory Tracking', lock: plan==='FREE'},
              {href:'/dashboard/analytics',label:'Analytics', lock: plan==='FREE'},
              {href:'/dashboard/files',label:'Files', lock: false},
              {href:'/dashboard/calendar',label:'Calendar', lock: false},
              {href:'/dashboard/invoices',label:'Invoices', lock: plan==='FREE'},
              {href:'/dashboard/timers',label:'Timers', lock: false}
            ].map((it) => (
              <a key={it.href} href={it.href} className="px-2 py-1 rounded hover:bg-slate-900/60">
                <span className="opacity-90 hover:opacity-100">{it.label}</span>
              </a>
            ))}
          </nav>
          <div className="justify-self-end">
            <MobileMenu plan={plan as any} />
          </div>
        </div>
      </header>
      <main className="max-w-screen-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}


