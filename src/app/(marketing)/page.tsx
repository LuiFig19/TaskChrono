// Minimal, dependency-light static marketing page

export const dynamic = 'force-static'
export const revalidate = 0

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      {/* Header removed to avoid client imports during static build */}

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                Stop losing money on <span className="tc-animated-gradient">inefficient time tracking</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                Launch faster, track smarter, and scale confidently—TaskChrono unifies time, projects, and analytics so teams of any size can deliver more with less hassle.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/get-started" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Get Started
              </Link>
              <Link href="#screenshot" className="border-2 border-slate-600 text-slate-200 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-slate-800 transition-all duration-300">
                View Demo
              </Link>
            </div>
            <div className="text-sm text-gray-500">Join <strong>20,000+ businesses</strong> boosting productivity with TaskChrono.</div>
          </div>
        </div>
      </section>

      {/* Additional marketing sections temporarily removed for a minimal, robust static build */}

      <section id="screenshot" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Dashboard Screenshot</h2>
            <p className="text-slate-300">A static preview of the TaskChrono dashboard</p>
          </div>
          <div className="rounded-2xl border border-slate-800 shadow-2xl bg-slate-950">
            {/* Replace live demo with static image. Add a subtle overlay at bottom-left to cover any watermark. */}
            <div className="relative">
              {/* Legacy anchor support so #demo also scrolls here */}
              <div id="demo" className="absolute -top-24" aria-hidden />
              <img
                src="/dashboarddemo.png"
                alt="TaskChrono dashboard screenshot"
                className="w-full h-auto rounded-2xl"
                loading="eager"
              />
              {/* Mask bottom-left corner to hide framework watermark in the screenshot */}
              <div className="pointer-events-none absolute left-2 bottom-2 h-12 w-28 rounded-md bg-slate-950/95" />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
// Minimal landing to bypass runtime errors and restore access. We'll re-enable rich sections after.
// Server component wrapper. Auto-launch behavior is handled by client component below.
// AutoLaunch temporarily disabled while we stabilize the landing runtime
// import AutoLaunch from './AutoLaunch'

// Removed second default export – the rich landing above is the single export.


