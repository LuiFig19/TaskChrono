import { type AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { PrismaAdapter } from '@auth/prisma-adapter'

const providers: AuthOptions['providers'] = []
const DEFAULT_LOCAL_DB = 'postgresql://postgres:postgres@localhost:5432/postgres?schema=taskchrono'
const dbConfigured = !!process.env.DATABASE_URL && process.env.DATABASE_URL !== DEFAULT_LOCAL_DB

if (dbConfigured && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      } as any,
      // Allow linking Google to existing accounts that share the same email
      // to avoid OAuthAccountNotLinked loops when a user first registered via credentials
      allowDangerousEmailAccountLinking: true as any,
    })
  )
}

providers.push(
  Credentials({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null
      const user = await prisma.user.findUnique({ where: { email: credentials.email } })
      if (!user?.passwordHash) return null
      const ok = await bcrypt.compare(credentials.password, user.passwordHash)
      if (!ok) return null
      return { id: user.id, name: user.name ?? '', email: user.email ?? '' }
    },
  })
)

export const authOptions: AuthOptions = {
  // Let NextAuth accept callbacks from any deployed host (Vercel sets NEXTAUTH_URL)
  // and add lightweight debug to capture future issues without affecting UI
  trustHost: true as any,
  debug: process.env.NODE_ENV !== 'production',
  cookies: {
    // Share OAuth transient cookies across apex and www in production
    state: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.state' : 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.taskchrono.org' : undefined,
      },
    },
    pkceCodeVerifier: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.pkce.code_verifier'
          : 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.taskchrono.org' : undefined,
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.taskchrono.org' : undefined,
      },
    },
  },
  adapter: dbConfigured ? (PrismaAdapter(prisma) as any) : (undefined as any),
  providers,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    signOut: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      const emailFromUser = (user as any)?.email as string | undefined
      const emailFromToken = (token as any)?.email as string | undefined
      const candidateEmail = emailFromUser || emailFromToken

      if (user) {
        // Default to the incoming user's id (works DB-less); role defaults to MEMBER
        token.id = (user as any).id
        ;(token as any).role = (token as any).role || 'MEMBER'
      }

      // If a database is configured, resolve the canonical DB user and align token.id to it
      if (dbConfigured) {
        try {
          let dbUser = null as any
          // Prefer lookup by email (stable across providers and prior DB-less sessions)
          if (candidateEmail) {
            dbUser = await prisma.user.findUnique({ where: { email: candidateEmail } })
          }
          // Fallback to lookup by existing token id
          if (!dbUser && (token as any).id) {
            dbUser = await prisma.user.findUnique({ where: { id: (token as any).id as string } })
          }
          if (dbUser) {
            token.id = dbUser.id
            ;(token as any).role = (dbUser as any)?.role ?? (token as any).role ?? 'MEMBER'
          }
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = (token as any).id
        ;(session.user as any).role = (token as any).role
      }
      return session
    },
  },
}


