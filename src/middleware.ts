import { withAuth } from 'next-auth/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest) {
    // Normalize host: redirect www --> apex to avoid NextAuth state/cookie mismatches
    const host = req.headers.get('host') || ''
    if (host.startsWith('www.')) {
      const url = req.nextUrl.clone()
      url.host = host.replace(/^www\./, '')
      return NextResponse.redirect(url, 308)
    }
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
  // Run on all routes so host normalization also applies to /api/auth/*
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}


