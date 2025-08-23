let StripeLib: any
try {
  // Optional dependency at build time to avoid failing when STRIPE_SECRET_KEY is not configured
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  StripeLib = require('stripe')
} catch {
  StripeLib = null
}

const secretKey = process.env.STRIPE_SECRET_KEY

export const stripe = (() => {
  if (!secretKey) {
    // In dev, we avoid crashing to allow pages to render; API routes will still guard.
    return null as unknown as any
  }
  if (!StripeLib) {
    return null as unknown as any
  }
  const s = new StripeLib(secretKey, {
    apiVersion: '2025-02-24.acacia',
  })
  return s
})()


