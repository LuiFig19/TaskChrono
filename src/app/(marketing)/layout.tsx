import '@/app/globals.css'
// Minimal layout to avoid client refs during build
import Link from 'next/link'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const quickshiftUrl = '/quickshift'
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b bg-gradient-to-b from-slate-950/95 to-slate-950/95 supports-[backdrop-filter]:bg-slate-950/95">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="font-bold text-xl">TaskChrono</Link>
            <Link href={quickshiftUrl} className="px-3 py-1.5 rounded-md border hidden sm:inline-block">QuickShift</Link>
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
              <Link href="#features">Features</Link>
              <Link href="#pricing">Pricing</Link>
              <Link href="#comparison">Competitor Comparison</Link>
              <Link href="/demo">Demo Dashboard</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/?signin=1&dst=%2Fdashboard" className="px-3 py-2 rounded-md border">Sign In</Link>
            <Link href="/get-started" className="px-4 py-2 rounded-md bg-black text-white hidden xs:inline-block">Get Started</Link>
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="border-t text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4 py-6">© {new Date().getFullYear()} TaskChrono</div>
      </footer>
    </div>
  )
}


