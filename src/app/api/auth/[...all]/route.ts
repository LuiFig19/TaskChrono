import { toNextJsHandler } from 'better-auth/next-js';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/better-auth';
import { ensureBetterAuthSchema } from '@/lib/dbMigrations';
import { withErrorHandling } from '@/lib/route-helpers';

const handler = toNextJsHandler(auth.handler);

export const GET = withErrorHandling(async (request: Request, ctx: any) => {
  await ensureBetterAuthSchema();
  // Friendly redirect for error page when social sign-in fails (e.g., no account)
  const url = new URL(request.url);
  if (url.pathname.endsWith('/error')) {
    const err = (url.searchParams.get('error') || '').toLowerCase();
    const noAccountErrors = new Set([
      'user_not_found',
      'account_not_found',
      'oauth_account_not_linked',
      'no_account',
    ]);
    if (noAccountErrors.has(err) || !err) {
      return NextResponse.redirect(new URL('/auth/popup/no-account', url.origin));
    }
  }
  // @ts-ignore
  return handler.GET(request, ctx);
});

export const POST = withErrorHandling(async (request: Request, ctx: any) => {
  await ensureBetterAuthSchema();
  // @ts-ignore
  return handler.POST(request, ctx);
});
