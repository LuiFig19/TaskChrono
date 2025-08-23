export const dynamic = 'force-static'
export const revalidate = 0

import LandingClient from './(marketing)/LandingClient'

export default function RootIndex() {
  return <LandingClient />
}
