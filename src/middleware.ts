import { withAuth } from 'next-auth/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest) {
    // Force apex -> www so OAuth state cookies are set and read on the same host
    const host = req.headers.get('host') || ''
    if (host === 'taskchrono.org') {
      const url = req.nextUrl.clone()
      url.host = 'www.taskchrono.org'
      return NextResponse.redirect(url, 308)
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Only require auth on dashboard
        return req.nextUrl.pathname.startsWith('/dashboard') ? !!token : true
      },
    },
  }
)

export const config = {
  // Run on all routes so host normalization always applies
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}


