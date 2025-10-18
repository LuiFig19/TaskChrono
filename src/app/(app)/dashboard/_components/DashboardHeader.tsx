"use client"
import Link from 'next/link'
import React from 'react'
import CompanySubtext from './CompanySubtext'
import ChatClientMount from '../ChatClientMount'
import MobileMenu from './MobileMenu'
import NavLinks from './NavLinks'
import ThemeToggle from '@/components/theme/ThemeToggle'

type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'

interface DashboardHeaderProps {
  plan: Plan
  userEmail?: string
}

export default function DashboardHeader({ plan, userEmail }: DashboardHeaderProps) {
  return (
    <header data-app-nav className="border-b bg-transparent dark:border-slate-800 dark:bg-slate-950/80 backdrop-blur dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="tc-nav-inner max-w-screen-2xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-2.5">
        <div className="leading-none">
          <Link href="/dashboard" className="tc-logo text-lg font-extrabold bg-clip-text text-transparent tracking-tight leading-none" suppressHydrationWarning>
            TaskChrono <span className={`ml-2 text-xs align-top ${plan==='FREE'?'text-emerald-400':plan==='BUSINESS'?'text-rose-400':plan==='ENTERPRISE'?'text-violet-400':'text-indigo-300'}`}>{plan.toLowerCase()}</span>
          </Link>
          {/* Company name under logo */}
          <CompanySubtext />
        </div>
        <NavLinks plan={plan} />
                <div className="justify-self-end flex items-center gap-2">
                  <span className="-mr-1.5"><ThemeToggle /></span>
                  <ChatClientMount />
                  <MobileMenu plan={plan} userEmail={userEmail} />
                </div>
      </div>
    </header>
  )
}

