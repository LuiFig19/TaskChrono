"use client"
import Link from 'next/link'
import { MotionDiv } from './ClientMotion'

export default function LandingPageBottom() {
  return (
    <section id="pricing" className="py-20 bg-slate-900">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Simple, transparent pricing</h2>
          <p className="text-slate-300 mt-2">14-day free trial on all paid tiers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: 'Free',
              price: 'Free forever',
              points: ['Up to 4 team members', 'Basic Time / Task Tracking', 'Up to 5 projects', 'Weekly reports'],
              href: '/get-started?plan=FREE',
            },
            {
              name: 'Business',
              price: '$5/user/mo',
              points: ['Unlimited projects', 'Advanced Analytics', 'Team management', 'Weekly summaries', 'Client portal access'],
              href: '/get-started?plan=BUSINESS',
              highlight: true,
              badge: 'Most Popular',
            },
            {
              name: 'Enterprise',
              price: '$12/user/mo',
              points: ['All Business features', 'Inventory Tracking', 'API access', 'Dedicated support', 'SSO & advanced permissions'],
              href: '/get-started?plan=ENTERPRISE',
            },
            {
              name: 'Custom',
              price: 'Contact Us',
              points: ['Tailored solutions for large-scale enterprises', 'Dedicated success engineer', 'Custom integrations'],
              href: '/get-started?plan=CUSTOM',
            },
          ].map((tier) => (
            <MotionDiv
              key={tier.name}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`relative rounded-2xl border border-slate-700 p-6 bg-slate-800/60 backdrop-blur-sm ${tier.highlight ? 'ring-2 ring-indigo-500 shadow-xl' : 'shadow-sm'}`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs bg-indigo-600 text-white shadow">
                  {tier.badge}
                </span>
              )}
              <div className="text-lg font-semibold text-white">{tier.name}</div>
              <div className="text-3xl mt-1 text-white">{tier.price}</div>
              <ul className="mt-5 space-y-2 text-sm text-slate-200">
                {tier.points.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
              <div className="mt-6">
                <Link href={tier.href} className={`block text-center px-4 py-2 rounded-lg transition-colors ${tier.highlight ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-slate-600 text-white hover:bg-slate-700'}`}>
                  {tier.name === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </Link>
              </div>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  )
}


