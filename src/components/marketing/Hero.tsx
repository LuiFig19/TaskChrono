"use client"
import { LazyMotion, m } from 'framer-motion'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />
      <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 text-center relative">
        <LazyMotion features={() => import('framer-motion').then((m) => m.domAnimation)}>
          <m.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight"
          >
            The Ultimate Platform to Optimize Productivity and Drive Growth
          </m.h1>
          <m.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mt-5 text-gray-600 text-lg md:text-xl max-w-3xl mx-auto"
          >
            Advanced project and time management designed for modern businesses.
          </m.p>
          <m.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-10 flex items-center justify-center gap-3"
          >
            <Link href="/get-started" className="px-6 py-3 rounded-lg bg-black text-white shadow-lg shadow-indigo-200/40 hover:scale-[1.02] transition-transform">Get Started</Link>
            <Link href="#screenshot" className="px-6 py-3 rounded-lg border hover:bg-gray-50 transition-colors">View Screenshot</Link>
          </m.div>
        </LazyMotion>
      </div>
    </section>
  )
}


