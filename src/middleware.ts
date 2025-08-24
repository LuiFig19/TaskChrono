import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => req.nextUrl.pathname.startsWith('/dashboard') ? !!token : true,
  },
})

export const config = {
  matcher: ['/dashboard/:path*'],
}


