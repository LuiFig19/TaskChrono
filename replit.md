# TaskChrono - Replit Migration

## Overview
TaskChrono is a comprehensive time tracking and project management application designed to enhance productivity for individuals and teams. Built with Next.js, it offers robust features including secure authentication, team collaboration, detailed time tracking, invoicing, and advanced analytics. The project aims to provide a seamless user experience across various platforms, supporting both local development and production deployments on Vercel and Replit, with a strong focus on investor-ready code quality and a polished user interface.

## User Preferences
- No user preferences have been documented yet.

## System Architecture

### Technology Stack
- **Framework**: Next.js 15.5.0 with App Router
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: Better-auth (Google OAuth, email/password)
- **Payments**: Stripe for subscription billing (14-day free trials)
- **Real-time**: Socket.io
- **UI**: Tailwind CSS 4, Framer Motion, Lucide icons
- **Forms**: React Hook Form with Zod validation

### UI/UX Decisions
- **Design Language**: Modern and clean, with support for both light and dark modes.
- **Authentication UI**: Features a redesigned signup/login page with gradient backgrounds, animated glow effects, proper form labels, focus states, and integrated Google OAuth.
- **Dashboard**: Customizable widget-based dashboard with smooth drag-and-drop functionality, optimized for performance across themes using specific CSS transitions and GPU acceleration techniques.
- **Branding**: Consistent TaskChrono branding across all user-facing components.

### Technical Implementations
- **Authentication**: Migrated from NextAuth.js to Better-auth for all authentication flows, including email/password and Google OAuth. This involves a dedicated API handler, client-side React hooks, and an updated Prisma schema.
- **Environment Management**: Smart environment detection for `baseURL` and `trustedOrigins` ensures consistent behavior across Replit, Vercel, and custom domains.
- **API Standardization**: All API routes use consistent error responses and unified request body parsing for improved code quality and maintainability.
- **Stripe Integration**: Comprehensive onboarding flow integrates Stripe checkout for subscription management, including automated 14-day free trials.
- **Database Schema**: Enhanced Prisma schema to align with Better-auth requirements and enforce `public` schema usage, ensuring proper user, account, and session management.
- **Deployment**: Optimized for Replit's autoscale deployment, using port 5000 and specific Next.js configurations for iframe-based preview environments.

### Key Features
- Multi-tenant organization and team management
- Project and task tracking
- Time tracking (timers and manual entries)
- Invoicing and billing
- Calendar integration
- File uploads and inventory management
- Real-time chat and collaboration
- Analytics and reporting (Recharts)
- Dark mode support

## External Dependencies
- **PostgreSQL**: Primary database accessed via Prisma ORM.
- **Google OAuth**: Used by Better-auth for social login.
- **Stripe**: Payment gateway for subscriptions, trials, and billing.
- **Resend**: Email service for transactional emails.
- **Socket.io**: For real-time communication features.
- **Framer Motion**: For UI animations.
- **Lucide icons**: Icon library.
- **Recharts**: For data visualization and analytics.