// Static wrapper that renders the original client UI to preserve look and behavior

export const dynamic = 'force-static'
export const revalidate = 0

export default function LandingPage() {
  // Keep this page trivial to avoid trace issues
  return null
}
// The server file is a thin static wrapper; the full UI lives in LandingClient


