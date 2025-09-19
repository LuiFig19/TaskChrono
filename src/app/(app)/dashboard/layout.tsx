import Link from 'next/link'
import React from 'react'
import { getUserPlan } from './_components/feature-gate'
import MobileMenu from './_components/MobileMenu'
import CompanySubtext from './_components/CompanySubtext'
import ChatClientMount from './ChatClientMount'
import NavLinks from './_components/NavLinks'

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
          <NavLinks plan={plan as any} />
          <div className="justify-self-end flex items-center gap-2">
            <ChatClientMount />
            <MobileMenu plan={plan as any} />
          </div>
        </div>
      </header>
      <main className="max-w-screen-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}


