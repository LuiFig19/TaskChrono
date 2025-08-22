"use client"
import dynamic from 'next/dynamic'
import Link from 'next/link'
const Header = dynamic(() => import('@/components/Header'), { ssr: false })
const DemoPreview = dynamic(() => import('@/components/marketing/DemoPreview'), { ssr: false })
const LandingPageBottom = dynamic(() => import('@/components/LandingPageBottom'), { ssr: false })
const AutoLaunch = dynamic(() => import('./AutoLaunch'), { ssr: false })
import { MotionDiv } from '@/components/ClientMotion'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      <AutoLaunch />
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <MotionDiv>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                Stop losing money on <span className="tc-animated-gradient">inefficient time tracking</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                Launch faster, track smarter, and scale confidently—TaskChrono unifies time, projects, and analytics so teams of any size can deliver more with less hassle.
              </p>
            </MotionDiv>
            <MotionDiv className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/get-started" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Get Started
              </Link>
              <Link href="#demo" className="border-2 border-slate-600 text-slate-200 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-slate-800 transition-all duration-300">
                View Demo
              </Link>
            </MotionDiv>
            <MotionDiv className="text-sm text-gray-500">Join <strong>20,000+ businesses</strong> boosting productivity with TaskChrono.</MotionDiv>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to manage your team</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">From time tracking to project management, we provide all the tools your business needs to stay organized and profitable.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '💬', title: 'Real‑time Team Chat (New)', description: 'Collaborate instantly with channel-based chat, live streaming updates, and message likes. All messages are saved and searchable.' },
              { icon: '🧩', title: 'Draggable, Customizable Dashboard (New)', description: 'Personalize your workspace with drag‑and‑drop widgets. Reorder, add or remove cards — your layout is saved across sessions.' },
              { icon: '⏱️', title: 'One-Click Time Tracking', description: 'Start and stop timers with a single click. Track time across multiple projects and tasks effortlessly.' },
              { icon: '📊', title: 'Advanced Project Management', description: 'Organize projects, assign tasks, set deadlines, and track progress with intuitive project boards.' },
              { icon: '📈', title: 'Real-Time Analytics', description: 'Get instant insights into productivity, project profitability, and team performance with detailed reports.' },
              { icon: '📦', title: 'Inventory Tracking', description: 'Monitor stock levels, track usage across projects, and manage supply chains efficiently.' },
            ].map((f) => (
              <MotionDiv key={f.title} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 250, damping: 18 }} className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-700">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{f.title}</h3>
                <p className="text-slate-300 leading-relaxed">{f.description}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      <LandingPageBottom />

      <section id="comparison" className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Why TaskChrono beats the competition</h2>
            <p className="text-slate-300 mt-2">More power, better insights, less cost.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[{
              title: 'Analytics Depth', ours: 'Real-time dashboards, AI Productivity Advisor', theirs: 'Basic weekly summaries'
            },{
              title: 'Project Management', ours: 'Kanban + Inventory module + automation', theirs: 'Limited task lists'
            },{
              title: 'Total Cost of Ownership', ours: 'Transparent pricing with free trial', theirs: 'Hidden fees and add-ons'
            }].map((c)=> (
              <MotionDiv key={c.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="text-xl font-semibold text-white mb-3">{c.title}</h3>
                <div className="text-sm">
                  <div className="mb-2"><span className="font-semibold text-emerald-400">TaskChrono:</span> {c.ours}</div>
                  <div className="text-slate-400"><span className="font-semibold text-slate-300">Others:</span> {c.theirs}</div>
                </div>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Live Demo</h2>
            <p className="text-slate-300">Explore the dashboard experience</p>
          </div>
          <div className="rounded-2xl border border-slate-800 shadow-2xl">
            {/* Use the same layout + preview to simulate live demo */}
            <div className="bg-slate-950">
              <div className="border-b border-slate-800 bg-slate-950/90 backdrop-blur rounded-t-2xl">
                <div className="px-4 py-3 flex items-center justify-between">
                  <a href="/" className="font-semibold text-white">TaskChrono</a>
                  <div className="hidden md:flex items-center gap-4 text-sm text-slate-200">
                    <a href="/demo-dashboard" className="hover:text-white">Tasks</a>
                    <a href="/demo-dashboard/projects" className="hover:text-white">Project Manager</a>
                    <a href="/demo-dashboard/files" className="hover:text-white">Saved Files</a>
                    <a href="/demo-dashboard/calendar" className="hover:text-white">Calendar</a>
                  </div>
                  <details className="relative md:hidden">
                    <summary className="list-none cursor-pointer text-slate-200">☰</summary>
                    <div className="absolute right-0 mt-2 w-48 rounded-md border border-slate-700 bg-slate-900 shadow-lg z-10">
                      <nav className="grid p-2 text-sm text-slate-200">
                        <a href="/demo-dashboard/inventory" className="px-3 py-2 rounded hover:bg-slate-800">Inventory Tracker</a>
                        <a href="/demo-dashboard/summaries" className="px-3 py-2 rounded hover:bg-slate-800">Weekly Summaries</a>
                        <a href="/demo-dashboard/settings" className="px-3 py-2 rounded hover:bg-slate-800">Account Settings</a>
                        <a href="/demo-dashboard/notifications" className="px-3 py-2 rounded hover:bg-slate-800">Notifications</a>
                        <a href="/demo-dashboard/reports" className="px-3 py-2 rounded hover:bg-slate-800">Reports</a>
                      </nav>
                    </div>
                  </details>
                </div>
              </div>
              <div className="px-4 py-6">
                <DemoPreview />
              </div>
            </div>
          </div>
          <div className="text-center mt-6">
            <a href="/demo-dashboard" className="inline-block px-5 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Open Full Demo</a>
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


