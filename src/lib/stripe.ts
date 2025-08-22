import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY

export const stripe = (() => {
  if (!secretKey) {
    // In dev, we avoid crashing to allow pages to render; API routes will still guard.
    return null as unknown as Stripe
  }
  const s = new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
  })
  return s
})()


