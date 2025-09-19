"use client"
import { usePathname } from 'next/navigation'

type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'

export default function NavLinks({ plan }: { plan: Plan }) {
  const pathname = usePathname()

  const items = [
    { href: '/dashboard/tasks', label: 'Tasks', lock: false },
    { href: '/dashboard/projects', label: 'Project Manager', lock: false },
    { href: '/dashboard/inventory', label: 'Inventory Tracking', lock: plan === 'FREE' },
    { href: '/dashboard/analytics', label: 'Analytics', lock: plan === 'FREE' },
    { href: '/dashboard/files', label: 'Files', lock: false },
    { href: '/dashboard/calendar', label: 'Calendar', lock: false },
    { href: '/dashboard/invoices', label: 'Invoices', lock: plan === 'FREE' },
    { href: '/dashboard/timers', label: 'Timers', lock: false },
  ]

  const isActive = (href: string) => {
    if (!pathname) return false
    // Active if the pathname starts with the link href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="hidden md:flex justify-center items-center gap-1 text-[16px] font-medium tracking-wide text-slate-200 whitespace-nowrap">
      {items.map((it) => (
        <a key={it.href} href={it.href} className="group relative px-3 py-1.5 rounded-md">
          <span className={`transition-[filter,color] ${isActive(it.href) ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]' : 'group-hover:drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]'} ${it.lock ? 'text-slate-400' : ''}`}>
            {it.label}{it.lock ? ' 🔒' : ''}
          </span>
          <span aria-hidden className={`pointer-events-none absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent ${isActive(it.href) ? 'via-indigo-400 opacity-100' : 'via-indigo-400 opacity-0 group-hover:opacity-100'} to-transparent transition-opacity duration-300`}></span>
        </a>
      ))}
    </nav>
  )
}


