"use client"
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function QuickShiftComingSoon() {
  return (
    <div className="min-h-[calc(100dvh)] bg-slate-950 text-slate-100 overflow-hidden relative">
      <div className="pointer-events-none absolute -inset-24 opacity-40 blur-3xl" aria-hidden>
        <div className="size-full bg-[radial-gradient(60%_60%_at_50%_50%,rgba(99,102,241,0.20),transparent_60%)]" />
      </div>

      <main className="relative max-w-screen-xl mx-auto px-4 py-16 sm:py-24">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent"
        >
          QuickShift
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mt-4 text-lg sm:text-xl text-slate-300 max-w-2xl"
        >
          Under development. Coming soon to supercharge your team scheduling and time tracking — designed to work beautifully with TaskChrono.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-10 grid gap-4 sm:grid-cols-2"
        >
          {[
            {
              title: 'Smart Scheduling',
              desc: 'Drag-and-drop shifts, conflict detection, labor cost insights.'
            },
            {
              title: 'Mobile Clock-in/out',
              desc: 'Location-aware, break tracking, photo verification.'
            },
            {
              title: 'Real-time Attendance',
              desc: 'Live dashboards, late alerts, and automated reminders.'
            },
            {
              title: 'Payroll-ready Exports',
              desc: 'Clean timesheets, overtime rules, and CSV exports.'
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-5"
            >
              <div className="text-base/6 font-semibold text-white">{f.title}</div>
              <div className="mt-1.5 text-sm text-slate-300">{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center gap-3"
        >
          <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-200">
            Private beta opens soon
          </span>
          <Link href="/get-started" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
            Get Started with TaskChrono
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {['Fast', 'Reliable', 'Modern UI'].map((chip) => (
            <div key={chip} className="rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2 text-sm text-slate-300">
              {chip}
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}


