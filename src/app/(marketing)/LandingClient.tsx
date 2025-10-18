"use client"
import dynamic from 'next/dynamic'
import React from 'react'
import Link from 'next/link'
import { MotionDiv } from '@/components/ClientMotion'

const Header = dynamic(() => import('@/components/Header'), { ssr: false })
const LandingPageBottom = dynamic(() => import('@/components/LandingPageBottom'), { ssr: false })
const AutoLaunch = dynamic(() => import('./AutoLaunch'), { ssr: false })

export default function LandingClient() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      <AutoLaunch />
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
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
              <Link href="#screenshot" className="border-2 border-slate-600 text-slate-200 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-slate-800 transition-all duration-300">
                View Demo
              </Link>
            </MotionDiv>
            <MotionDiv className="text-sm text-gray-500">Join <strong>20,000+ businesses</strong> boosting productivity with TaskChrono.</MotionDiv>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-slate-900">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <MotionDiv key={f.title} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 250, damping: 18 }} className="tc-feature-card bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-700">
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
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Why TaskChrono beats the competition</h2>
            <p className="text-slate-300 mt-2">More power, better insights, less cost.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Analytics Depth', ours: 'Real-time dashboards, AI Productivity Advisor', theirs: 'Basic weekly summaries' },
              { title: 'Project Management', ours: 'Kanban + Inventory module + automation', theirs: 'Limited task lists' },
              { title: 'Total Cost of Ownership', ours: 'Transparent pricing with free trial', theirs: 'Hidden fees and add-ons' },
            ].map((c) => (
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

      <section id="screenshot" className="py-20 bg-slate-900">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Product Preview</h2>
            <p className="text-slate-300">Slideshow of screenshots (placeholders for now)</p>
          </div>
          <Slideshow />
        </div>
      </section>
    </main>
  )
}

function Slideshow() {
  const total = 5
  const [idx, setIdx] = React.useState(0)
  React.useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 5000)
    return () => clearInterval(t)
  }, [])
  const prev = () => setIdx((i) => (i - 1 + total) % total)
  const next = () => setIdx((i) => (i + 1) % total)
  return (
    <div className="relative rounded-2xl border border-slate-800 shadow-2xl bg-slate-950 overflow-hidden">
      <div className="aspect-[16/9] grid place-items-center text-slate-400">
        <div className="text-center">
          <div className="text-sm">Slide {idx + 1} / {total}</div>
          <div className="mt-2 text-xs">(placeholder — images coming soon)</div>
        </div>
      </div>
      <button onClick={prev} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-md bg-slate-800/70 hover:bg-slate-800 text-white">⟵</button>
      <button onClick={next} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-md bg-slate-800/70 hover:bg-slate-800 text-white">⟶</button>
    </div>
  )
}



