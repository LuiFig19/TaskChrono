TaskChrono – Production-Ready SaaS Template

Overview

TaskChrono is a modern SaaS for time tracking, projects, analytics, teams, and billing. The codebase is production-ready with strict TypeScript, ESLint + Prettier, husky pre-commit hooks, and feature-based organization.

Core Features

- Dashboard with draggable widgets, analytics, calendar, and inventory summary
- Authentication (Better Auth / NextAuth style) with Google OAuth support
- Projects, tasks, timers, files, billing (Stripe), teams (chat, goals, notes)
- Feature flags/plan gating and role-based controls
- Real-time updates via EventSource and Socket.IO

Tech Stack

- Next.js (App Router), React 19, TypeScript, Tailwind CSS
- Prisma + PostgreSQL
- Stripe for billing
- SWR for client data fetching
- Pino for structured logging
- ESLint + Prettier + Husky (lint-staged)

Getting Started

1. Environment

- Copy ENV.EXAMPLE to .env and fill values (ensure ?schema=taskchrono in DATABASE_URL)

2. Install

```
npm install
```

3. Database

```
npx prisma generate
npx prisma migrate dev
```

4. Run

```
npm run dev
```

Scripts

- dev: Start dev server
- build: Prisma generate + Next build
- start: Start production server
- lint, lint:fix: Lint codebase (Next/TypeScript best practices)
- format, format:check: Prettier formatting

Environment Variables

See ENV.EXAMPLE for full list: NextAuth/Better Auth, Google OAuth, Stripe, email, DB URL, public app URL, admin token.

Deployment

- Vercel recommended. Ensure env vars are set. Stripe webhook URL must be configured.
- Database: Neon or Supabase Postgres.

Performance & Scalability

- ISR (Incremental Static Regeneration): marketing pages use `revalidate = 3600` by default. Adjust per page if needed.
- Client fetch deduping: SWR is configured globally (credentials included, dedupingInterval=2s) in `src/components/theme/ClientProviders.tsx`.
- Server-side caching: Hot GET routes cache short-lived results in Redis (Upstash) with in-memory fallback.
  - Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to enable production cache/limits.
- Rate limiting: `@upstash/ratelimit` provides a sliding-window limiter; falls back to in-memory counter during local dev.
- Database pooling: When deployed on Vercel with Neon, connection pooling is managed automatically (no PgBouncer setup required). Use a pooled connection string and you may include `connection_limit=10` in `DATABASE_URL` if needed for your plan.

Bundle Analysis

- Run analyzer: `npm run analyze` (uses `@next/bundle-analyzer`).
- Suggestions:
  - Prefer dynamic imports for heavy components.
  - Use `modularizeImports` (already configured for `lucide-react`).
  - Avoid large optional dependencies in the server/runtime path.

Environment

Required for production features:

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
DATABASE_URL=postgresql://... (pooled Neon URL)
```


Contributing

- Branch from main, use conventional commits (feat:, fix:, chore:)
- Pre-commit hook auto lints and formats (husky + lint-staged)

Changelog

See CHANGELOG.md for releases and notable changes.
