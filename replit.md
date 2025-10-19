# TaskChrono - Replit Migration

## Overview
TaskChrono is a comprehensive time tracking and project management application built with Next.js 15, featuring authentication, team collaboration, time tracking, invoicing, and analytics capabilities.

## Recent Changes

### Complete Onboarding Flow with Stripe Integration (October 19, 2025) ✅ COMPLETED
- **Non-Persistent Sessions**: Configured Better-auth sessions to expire when browser closes (removed expiresIn/updateAge, using only cookieCache with maxAge:0)
- **Fresh Signup Flow**: Tier selection now redirects to register page, not onboarding - ensures new users always create accounts first
- **14-Day Free Trial Messaging**: Added clear trial messaging on register page for Business ($5/user/mo) and Enterprise ($12/user/mo) tiers
- **Stripe Checkout Integration**: After workspace creation, paid tiers redirect to Stripe checkout with 14-day trial automatically configured
- **Beautiful Activation Page**: Created post-payment success page with green checkmark, trial details, and "Go to Dashboard" CTA
- **Dashboard Migration**: Fully migrated dashboard from NextAuth to Better-auth - users without organizations redirect to onboarding
- **Complete Flow**: Landing → Get Started → Select Tier → Register → Create Workspace → Stripe (if paid) → Activation → Dashboard
- **No Auto-Login**: Sessions don't persist across browser sessions - users must explicitly sign in each time

### Database Schema Fix (October 19, 2025) ✅ COMPLETED
- **Critical Bug**: Fixed Prisma client forcing `schema=taskchrono` instead of using default `public` schema
- **Root Cause**: `src/lib/prisma.ts` had `ensureSchemaParam()` function that appended `schema=taskchrono` to DATABASE_URL
- **Fix**: Removed schema-forcing logic to allow Prisma to use default `public` schema
- **Better-auth Schema Alignment**: Updated Prisma models to match Better-auth requirements:
  - User model: Changed `emailVerified` from `DateTime?` to `Boolean @default(false)`
  - Account model: Added `accountId`, `password` fields and set `providerUserId` default
  - Session model: Added `ipAddress` and `userAgent` fields
- **Result**: Better-auth signup now works correctly - users can create accounts with email/password

### Beautiful Authentication UI (October 19, 2025) ✅ COMPLETED
- **Signup Page**: Redesigned with gradient background (slate-900 to blue-950), animated glow effects
- **Login Page**: Matching beautiful design with "Welcome back" messaging
- **Features**: TaskChrono branding, labeled form inputs, indigo buttons with shadow glow, Google OAuth integration
- **UX**: Proper form labels, focus states with indigo ring, placeholder text, error styling

### Better-auth Integration (October 19, 2025) ✅ COMPLETED
- **Primary Authentication**: Migrated from NextAuth.js to Better-auth as the primary authentication system
- **Email/Password Auth**: Implemented Better-auth email/password authentication with secure signup and login
- **Google OAuth**: Configured Google OAuth integration through Better-auth
- **Database Schema**: Updated Prisma schema with Better-auth compatible field mappings
  - Account model: Uses `providerUserId` and `expiresAt DateTime` for social auth accounts
  - Session model: Uses `token` and `expiresAt` fields
  - Both models include `createdAt` and `updatedAt` timestamps
- **API Routes**: Created Better-auth API handler at `/api/auth/[...all]/`
- **Client Integration**: Set up Better-auth React hooks for client-side authentication
- **Middleware**: Fixed Edge Runtime compatibility by using cookie-based session checking instead of Prisma queries
- **Components**: Migrated login, register, dashboard, and onboarding components to use Better-auth
- **Onboarding Flow**: Complete user journey from landing → tier selection → Better-auth signup/login → organization creation → dashboard

### Migration from Vercel to Replit (October 19, 2025) ✅ COMPLETED
- **Port Configuration**: Updated all dev and start scripts to use port 5000 with 0.0.0.0 binding for Replit compatibility
- **Database**: Connected to Replit PostgreSQL (Neon-backed) and ran Prisma migrations successfully with `npx prisma db push`
- **Environment Variables**: All required secrets configured in Replit Secrets (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY)
- **Build Process**: Simplified build script, removed turbopack for stability, ensured Prisma generation in build and postinstall
- **Next.js Config**: Added `allowedDevOrigins` with proper domain variations (bare domain, https://, http://, localhost, 127.0.0.1) for Replit's iframe-based preview environment - eliminates cross-origin warnings
- **Deployment**: Configured for autoscale deployment with proper build (`npm run build`) and start (`npm run start`) commands
- **Verification**: Application runs successfully on port 5000, serving pages without errors, all UI elements render correctly

## Project Architecture

### Technology Stack
- **Framework**: Next.js 15.5.0 with App Router
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: Better-auth with Google OAuth and email/password auth
- **Payments**: Stripe integration for subscription billing with 14-day free trials
- **Real-time**: Socket.io for live updates
- **UI**: Tailwind CSS 4, Framer Motion, Lucide icons
- **Forms**: React Hook Form with Zod validation

### Key Features
- Multi-tenant organization and team management
- Project and task tracking with assignments
- Time tracking with timers and manual entries
- Invoicing and billing
- Calendar integration
- File uploads and inventory management
- Real-time chat and collaboration
- Analytics and reporting (Recharts)
- Dark mode support

### Database Schema
Comprehensive Prisma schema including:
- User management and authentication (Better-auth models)
- Organizations and teams with member roles
- Projects, tasks, and time entries
- Invoicing and billing
- Inventory tracking
- File management
- Widget layouts for customizable dashboards

## Environment Configuration

### Required Environment Variables
All configured in Replit Secrets:
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
- `NEXTAUTH_SECRET`: Session encryption key
- `NEXTAUTH_URL`: Application URL
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `STRIPE_SECRET_KEY`: Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `RESEND_API_KEY`: Email service API key

### Optional Variables
- `RESEND_FROM`: Email sender address
- `NEXT_PUBLIC_QUICKSHIFT_URL`: QuickShift feature URL

## Development

### Commands
- `npm run dev`: Start development server on port 5000
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npx prisma studio`: Open Prisma Studio for database management
- `npx prisma db push`: Push schema changes to database

### Development Notes
- Server runs on port 5000 (required by Replit)
- Hot module reload warnings are normal in Replit's iframe environment
- Prisma client auto-generates on `npm install` via postinstall script
- React strict mode is disabled for compatibility with certain third-party components

## Deployment

### Configuration
- **Target**: Autoscale (stateless web application)
- **Build**: `npm run build` (includes Prisma generation)
- **Start**: `npm run start` (production Next.js server on port 5000)

### Pre-deployment Checklist
- Ensure all environment variables are set in production secrets
- Run database migrations if schema changed
- Test authentication flows (Google OAuth, credentials)
- Verify Stripe webhook endpoints are configured
- Check email sending functionality

## User Preferences
(To be documented as preferences are expressed)
