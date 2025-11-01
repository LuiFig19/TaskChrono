import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';

import { prisma } from '@/lib/prisma';

/**
 * Determines the base URL for Better Auth
 * Priority: Custom domain > Vercel URL > Replit domain > localhost
 */
function getBaseURL(): string {
  // Production: Use NEXTAUTH_URL if set (custom domain)
  if (process.env.NEXTAUTH_URL) {
    // Normalize to avoid issues like "http://127.0.0.1:3002 /api/auth" (note the space)
    return process.env.NEXTAUTH_URL.trim().replace(/\/$/, '');
  }

  // Vercel: Use VERCEL_URL (automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Replit: Use REPLIT_DEV_DOMAIN
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }

  // Development fallback (align with our dev server on 127.0.0.1:3002)
  return 'http://127.0.0.1:3002';
}

/**
 * Gets trusted origins for Better Auth
 */
function getTrustedOrigins(): string[] {
  const origins: string[] = [];

  // Add custom domain if set
  if (process.env.NEXTAUTH_URL) {
    origins.push(process.env.NEXTAUTH_URL);
  }

  // Add Vercel URL if available
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  // Add Replit domains if available
  if (process.env.REPLIT_DEV_DOMAIN) {
    origins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    origins.push(`http://${process.env.REPLIT_DEV_DOMAIN}`);
  }

  // Always allow localhost for development
  origins.push('http://localhost:3000');
  origins.push('http://127.0.0.1:3000');
  // Also allow alternative local dev ports
  origins.push('http://localhost:3001');
  origins.push('http://127.0.0.1:3001');
  origins.push('http://localhost:3002');
  origins.push('http://127.0.0.1:3002');
  origins.push('http://localhost:5000');
  origins.push('http://127.0.0.1:5000');

  return origins;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
  advanced: {
    cookiePrefix: 'taskchrono',
  },
  secret:
    process.env.NEXTAUTH_SECRET || process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-dev',
  baseURL: getBaseURL(),
  trustedOrigins: getTrustedOrigins(),
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
