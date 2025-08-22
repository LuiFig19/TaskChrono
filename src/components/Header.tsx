"use client"
import Link from 'next/link'

export default function Header() {
  const quickshiftUrl = '/quickshift'
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Logo with gradient */}
        <Link href="/" className="text-xl font-extrabold bg-gradient-to-r from-white via-indigo-300 to-violet-400 bg-clip-text text-transparent tracking-tight">
          TaskChrono
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex justify-center items-center gap-1 text-[16px] font-medium tracking-wide text-slate-200">
          {[
            { href: '#features', label: 'Features' },
            { href: '#pricing', label: 'Pricing' },
            { href: '#comparison', label: 'Comparison' },
            { href: '#demo', label: 'Demo' },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative px-3 py-1.5 rounded-md hover:text-white transition-colors"
            >
              <span className="transition-[filter] group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.55)]">{l.label}</span>
              <span
                className="pointer-events-none absolute inset-x-2 -bottom-1 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
            </a>
          ))}
        </nav>

        {/* Right actions: QuickShift highlighted, then auth CTAs */}
        <div className="flex items-center gap-2 justify-end">
          <Link
            href={quickshiftUrl}
            className="relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 hover:from-fuchsia-400 hover:via-violet-400 hover:to-indigo-400 transition-colors"
          >
            QuickShift
            <span className="absolute -inset-px rounded-md ring-1 ring-white/10" aria-hidden />
          </Link>
          <Link href="/login" className="px-3 py-2 rounded-md text-slate-200 hover:text-white">Sign In</Link>
          <Link href="/get-started" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Get Started</Link>
        </div>
      </div>
    </header>
  )
}


