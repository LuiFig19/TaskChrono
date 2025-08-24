import { withAuth } from 'next-auth/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export default withAuth(
  function middleware(_req: NextRequest) {
    // Do not perform host redirects here to avoid conflict with Vercel domain redirects
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  // Keep middleware active site-wide for auth checks, but no host rewrites
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}


