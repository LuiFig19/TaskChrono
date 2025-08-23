// Static wrapper that renders the original client UI to preserve look and behavior

import LandingClient from './LandingClient'

export const dynamic = 'force-static'
export const revalidate = 0

export default function LandingPage() {
  return <LandingClient />
}
// The server file is a thin static wrapper; the full UI lives in LandingClient


