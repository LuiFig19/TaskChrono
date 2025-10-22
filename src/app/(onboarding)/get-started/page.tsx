"use client"

import Link from 'next/link'
import { LazyMotion, m } from 'framer-motion'
import { CheckCircle2, Sparkles, BarChart3, Boxes } from 'lucide-react'

type Tier = {
  key: string
  name: string
  price: string
  features: string[]
  highlight?: string
  recommended?: boolean
}

const tiers: Tier[] = [
  {
    key: 'FREE',
    name: 'Free',
    price: 'Free',
    highlight: 'Basic Time / Task Tracking',
    features: [
      'Track time, tasks, and projects for up to 5 active projects',
      '4 users included',
      'Mobile & desktop access',
      'Simple progress dashboard',
      'Export reports as CSV or PDF',
      'Basic reminders & deadlines',
    ],
  },
  {
    key: 'BUSINESS',
    name: 'Business',
    price: '$5/user/mo',
    highlight: 'Advanced Analytics',
    recommended: true,
    features: [
      'Unlimited projects, tasks, and teams',
      'Advanced analytics & performance insights',
      'Smart task prioritization (AI suggestions)',
      'Team management with roles & permissions',
      'Weekly & monthly progress summaries',
      'File storage & document sharing',
      'Built-in meeting scheduler & calendar sync',
    ],
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: '$12/user/mo',
    highlight: 'Inventory Tracking + Efficiency Tools',
    features: [
      'All “Business” features included',
      'Real-time inventory & asset tracking',
      'Automated recurring task workflows',
      'Built-in invoice & expense tracker',
      'Employee productivity heatmaps',
      'Offline mode for field teams',
      'Enhanced security with 2FA & encrypted storage',
    ],
  },
  {
    key: 'CUSTOM',
    name: 'Custom',
    price: 'Contact Us',
    features: [
      'Fully custom dashboard & workflow automation',
      'Unlimited everything (users, projects, storage)',
      'White-label branding for your business',
      'Industry-specific tool bundles (construction, marketing, tech, etc.)',
      'Business efficiency audit & optimization setup',
      'AI-powered reporting & forecasting',
    ],
  },
]

const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.06, duration: 0.35, ease: 'easeOut' },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export default function GetStartedPage() {
  return (
    <div data-tier-selection-page className="min-h-[90vh] bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-screen-2xl mx-auto px-4 py-14">
        <LazyMotion features={() => import('framer-motion').then((m)=>m.domAnimation)}>
          <m.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Choose your plan</h1>
            <p className="text-gray-600 dark:text-slate-300 mt-2">14-Day Free Trial for all paid tiers</p>
          </m.div>

          <m.div
            variants={container}
            initial={false}
            animate="show"
            className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {tiers.map((t) => (
              <m.div variants={item} key={t.key}>
                <Link
                  href={`/register?plan=${t.key}`}
                  data-tier-card
                  data-tier={t.key}
                  className="group relative block h-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 hover:border-indigo-400 dark:hover:border-slate-700 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_10px_40px_-10px_rgba(0,0,0,0.7)] transition-all duration-300"
                  aria-label={`Select ${t.name} plan`}
                >
                  {t.recommended && (
                    <span className="absolute -top-3 left-6 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow">
                      Recommended
                    </span>
                  )}

                  <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                    {t.key === 'FREE' && <Sparkles className="h-4 w-4 text-indigo-400" />}
                    {t.key === 'BUSINESS' && <BarChart3 className="h-4 w-4 text-indigo-400" />}
                    {t.key === 'ENTERPRISE' && <Boxes className="h-4 w-4 text-indigo-400" />}
                    <span className="text-sm">{t.name}</span>
                  </div>

                  <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{t.price}</div>
                  {(t.key !== 'FREE' && t.key !== 'CUSTOM') && (
                    <div className="mt-1 flex flex-col gap-2 items-start">
                      <div className="inline-flex rounded-md bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-300">
                        14‑day free trial
                      </div>
                      {t.highlight && (
                        <div className="inline-flex items-center gap-1 rounded-md border border-indigo-200 dark:border-indigo-700/40 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 text-[11px] text-indigo-700 dark:text-indigo-200">
                          <Sparkles className="h-3 w-3" /> {t.highlight}
                        </div>
                      )}
                    </div>
                  )}

                  <ul className="mt-5 space-y-2 text-sm text-gray-700 dark:text-slate-300">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-400" /> {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 text-xs text-gray-500 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-300">Click to select</div>

                  <div className="pointer-events-none absolute inset-0 rounded-2xl ring-0 transition-[box-shadow] group-hover:shadow-[inset_0_0_0_1px_rgba(99,102,241,0.35)]" />
                </Link>
              </m.div>
            ))}
          </m.div>
        </LazyMotion>
      </div>
    </div>
  )
}


