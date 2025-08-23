// Static wrapper that renders the original client UI to preserve look and behavior

export const dynamic = 'force-static'
export const revalidate = 0

export default function LandingPage() {
  // Render the original client UI via a client component to keep the look identical
  const Client = require('./LandingClient').default
  return <Client />
}
// The server file is a thin static wrapper; the full UI lives in LandingClient


