import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
})

export const config = {
  // Only protect the dashboard. Do not run on /api/auth to avoid OAuth callback issues.
  matcher: ['/dashboard/:path*'],
}


