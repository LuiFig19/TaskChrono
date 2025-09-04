"use client"
import { CheckCircle2, XCircle } from 'lucide-react'
import { LazyMotion, m } from 'framer-motion'
import Link from 'next/link'

type Tier = {
  name: string
  price: string
  blurb: string
  features: { label: string; included?: boolean }[]
  cta: { label: string; href: string }
  highlight?: boolean
}

const tiers: Tier[] = [
  {
    name: 'Free',
    price: 'Free',
    blurb: 'Basic Time / Task Tracking',
    features: [
      { label: 'Track time, tasks, and 1 active project', included: true },
      { label: '3 users included', included: true },
      { label: 'Mobile & desktop access', included: true },
      { label: 'Simple progress dashboard', included: true },
      { label: 'Export reports as CSV or PDF', included: true },
      { label: 'Basic reminders & deadlines', included: true },
    ],
    cta: { label: 'Start Free', href: '/get-started?plan=FREE' },
  },
  {
    name: 'Business',
    price: '$5/user/mo',
    blurb: 'Advanced Analytics • Recommended',
    features: [
      { label: 'Unlimited projects, tasks, and teams', included: true },
      { label: 'Advanced analytics & performance insights', included: true },
      { label: 'Smart task prioritization (AI suggestions)', included: true },
      { label: 'Team management with roles & permissions', included: true },
      { label: 'Weekly & monthly progress summaries', included: true },
      { label: 'File storage & document sharing', included: true },
      { label: 'Built-in meeting scheduler & calendar sync', included: true },
    ],
    cta: { label: 'Start 14‑day Trial', href: '/get-started?plan=BUSINESS' },
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$12/user/mo',
    blurb: 'Inventory Tracking + Efficiency Tools',
    features: [
      { label: 'All “Business” features included', included: true },
      { label: 'Real-time inventory & asset tracking', included: true },
      { label: 'Automated recurring task workflows', included: true },
      { label: 'Built-in invoice & expense tracker', included: true },
      { label: 'Employee productivity heatmaps', included: true },
      { label: 'Offline mode for field teams', included: true },
      { label: 'Enhanced security with 2FA & encrypted storage', included: true },
    ],
    cta: { label: 'Start 14‑day Trial', href: '/get-started?plan=ENTERPRISE' },
  },
  {
    name: 'Custom',
    price: 'Contact Us',
    blurb: 'Fully custom setup & automation',
    features: [
      { label: 'Fully custom dashboard & workflow automation', included: true },
      { label: 'Unlimited everything (users, projects, storage)', included: true },
      { label: 'White-label branding for your business', included: true },
      { label: 'Industry-specific tool bundles', included: true },
      { label: 'Business efficiency audit & optimization setup', included: true },
      { label: 'AI-powered reporting & forecasting', included: true },
    ],
    cta: { label: 'Contact Sales', href: '/get-started?plan=CUSTOM' },
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="max-w-screen-2xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold">Pricing</h2>
        <p className="text-gray-600 mt-2">14-day free trial on all paid tiers</p>
      </div>
      <LazyMotion features={() => import('framer-motion').then((m)=>m.domAnimation)}>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier, i) => (
            <m.div
              key={tier.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className={`relative rounded-2xl border p-6 bg-white/60 backdrop-blur-sm ${
                tier.highlight ? 'ring-2 ring-indigo-500 shadow-xl' : 'shadow-sm'
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs bg-indigo-600 text-white shadow">
                  Most Popular
                </span>
              )}
              <div className="text-lg font-semibold">{tier.name}</div>
              <div className="text-3xl mt-1">{tier.price}</div>
              <div className="text-sm text-gray-600 mt-1">{tier.blurb}</div>
              <ul className="mt-5 space-y-2 text-sm">
                {tier.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2">
                    {f.included ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300" />
                    )}
                    <span className={f.included ? '' : 'text-gray-400'}>{f.label}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href={tier.cta.href}
                  className={`block text-center px-4 py-2 rounded-lg transition-colors ${
                    tier.highlight ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border hover:bg-gray-50'
                  }`}
                >
                  {tier.cta.label}
                </Link>
              </div>
            </m.div>
          ))}
        </div>
      </LazyMotion>
    </section>
  )
}


