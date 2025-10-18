"use client"
import Link from 'next/link'
import { MotionDiv } from './ClientMotion'

export default function LandingPageBottom() {
  return (
    <section id="pricing" className="py-20 bg-slate-900">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold dark:text-white light:text-slate-900">Simple, transparent pricing</h2>
          <p className="dark:text-slate-300 light:text-slate-600 mt-2">14-day free trial on all paid tiers</p>
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
              className={`tc-pricing-card ${tier.highlight ? 'tc-pricing-card--popular' : ''} relative rounded-2xl border border-slate-700 p-6 bg-slate-800/60 backdrop-blur-sm ${tier.highlight ? 'ring-2 ring-indigo-500 shadow-xl' : 'shadow-sm'}`}
            >
              {tier.badge && (
                <span className="badge absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs bg-indigo-600 text-white shadow">
                  {tier.badge}
                </span>
              )}
              <div className="title text-lg font-semibold dark:text-white light:text-slate-900">{tier.name}</div>
              <div className="price text-3xl mt-1 dark:text-white light:text-slate-900">{tier.price}</div>
              <ul className="mt-5 space-y-2 text-sm dark:text-slate-200 light:text-slate-600">
                {tier.points.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href={tier.href}
                  className={`tc-pricing-cta ${tier.name === 'Custom' ? 'tc-cta-orange' : tier.name === 'Free' ? 'tc-cta-blue' : 'tc-cta-green'} block text-center px-4 py-2 rounded-lg transition-colors`}
                >
                  {tier.name === 'Custom' ? 'Contact Sales' : tier.name === 'Free' ? 'Sign Up' : 'Start Free Trial'}
                </Link>
              </div>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  )
}


